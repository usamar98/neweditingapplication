import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { Transcript, TranscriptSegment, TranscriptWord } from "../../src/lib/domain/video";
import type { WorkerConfig } from "../config";
import { createWorkerFalClient } from "./fal/client";
import { resolveFalModel, type FalModelSelection } from "./fal/routing";

export interface TranscriptionProvider {
  readonly model?: string;
  readonly name: string;
  readonly routing?: FalModelSelection;
  transcribe(audioPath: string): Promise<Transcript>;
}

const remoteResponseSchema = z.object({
  language: z.string().nullable().optional(),
  segments: z
    .array(
      z.object({
        end: z.number(),
        id: z.number().optional(),
        start: z.number(),
        text: z.string(),
        words: z
          .array(
            z.object({
              end: z.number(),
              start: z.number(),
              word: z.string().optional(),
              text: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .default([]),
  text: z.string().default(""),
  words: z
    .array(
      z.object({
        end: z.number(),
        start: z.number(),
        word: z.string().optional(),
        text: z.string().optional(),
      }),
    )
    .optional(),
});

function normalizeWord(word: { end: number; start: number; text?: string; word?: string }): TranscriptWord {
  return { end: word.end, start: word.start, text: (word.word ?? word.text ?? "").trim() };
}

function wordsForSegment(words: TranscriptWord[], start: number, end: number) {
  return words.filter((word) => word.start >= start - 0.02 && word.end <= end + 0.02);
}

class LocalTranscriptionProvider implements TranscriptionProvider {
  readonly name = "local";

  async transcribe() {
    return { language: null, segments: [], text: "" } satisfies Transcript;
  }
}

class OpenAICompatibleTranscriptionProvider implements TranscriptionProvider {
  readonly model: string;
  readonly name: string;

  constructor(
    private readonly config: WorkerConfig,
    private readonly markProviderBillingStarted: () => Promise<void>,
    providerName: "openai" | "openai-compatible",
  ) {
    this.name = providerName;
    this.model = config.TRANSCRIPTION_MODEL;
  }

  async transcribe(audioPath: string): Promise<Transcript> {
    if (!this.config.TRANSCRIPTION_API_KEY) {
      throw new Error(`${this.name} transcription requires TRANSCRIPTION_API_KEY.`);
    }

    const form = new FormData();
    const audio = await readFile(audioPath);
    form.append("file", new Blob([audio], { type: "audio/mpeg" }), "audio.mp3");
    form.append("model", this.config.TRANSCRIPTION_MODEL);
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");
    form.append("timestamp_granularities[]", "word");

    await this.markProviderBillingStarted();
    const response = await fetch(this.config.TRANSCRIPTION_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.config.TRANSCRIPTION_API_KEY}` },
      body: form,
      signal: AbortSignal.timeout(30 * 60 * 1000),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Transcription provider returned ${response.status}: ${body.slice(0, 500)}`);
    }

    const parsed = remoteResponseSchema.parse(await response.json());
    const topLevelWords = (parsed.words ?? []).map(normalizeWord).filter((word) => word.text);
    const segments: TranscriptSegment[] = parsed.segments.map((segment, index) => {
      const nestedWords = (segment.words ?? []).map(normalizeWord).filter((word) => word.text);
      return {
        end: segment.end,
        id: segment.id ?? index,
        start: segment.start,
        text: segment.text.trim(),
        words: nestedWords.length > 0 ? nestedWords : wordsForSegment(topLevelWords, segment.start, segment.end),
      };
    });

    return {
      language: parsed.language ?? null,
      segments,
      text: parsed.text.trim(),
    };
  }
}

const falTranscriptSchema = z.object({
  chunks: z
    .array(
      z.object({
        text: z.string(),
        timestamp: z.array(z.number().nullable()).length(2).optional(),
      }),
    )
    .default([]),
  inferred_languages: z.array(z.string()).default([]),
  text: z.string().default(""),
});

function buildSegments(words: TranscriptWord[]): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  let current: TranscriptWord[] = [];

  const flush = () => {
    if (current.length === 0) return;
    segments.push({
      end: current.at(-1)?.end ?? current[0].end,
      id: segments.length,
      start: current[0].start,
      text: current.map((word) => word.text).join(" ").trim(),
      words: current,
    });
    current = [];
  };

  for (const word of words) {
    const previous = current.at(-1);
    const longSegment = current.length >= 18 || (current[0] && word.end - current[0].start >= 8);
    const longPause = previous ? word.start - previous.end >= 1 : false;
    if (current.length > 0 && (longSegment || longPause)) flush();
    current.push(word);
    if (/[.!?][\]"')]*$/.test(word.text)) flush();
  }
  flush();
  return segments;
}

export function normalizeFalTranscript(value: unknown): Transcript {
  const parsed = falTranscriptSchema.parse(value);
  const words = parsed.chunks.flatMap((chunk) => {
    const [start, end] = chunk.timestamp ?? [];
    const text = chunk.text.trim();
    if (start == null || end == null || start < 0 || end <= start || !text) return [];
    return [{ end, start, text } satisfies TranscriptWord];
  });

  return {
    language: parsed.inferred_languages[0] ?? null,
    segments: buildSegments(words),
    text: parsed.text.trim() || words.map((word) => word.text).join(" "),
  };
}

class FalTranscriptionProvider implements TranscriptionProvider {
  readonly model: string;
  readonly name = "fal";
  readonly routing: FalModelSelection;

  constructor(
    private readonly config: WorkerConfig,
    private readonly markProviderBillingStarted: () => Promise<void>,
  ) {
    this.routing = resolveFalModel({
      capability: "transcription",
      overrides: config.FAL_MODEL_OVERRIDES,
      profile: config.FAL_ROUTING_PROFILE,
    });
    this.model = this.routing.endpointId;
  }

  async transcribe(audioPath: string): Promise<Transcript> {
    const client = createWorkerFalClient(this.config.FAL_KEY);
    const audio = await readFile(audioPath);
    const audioUrl = await client.storage.upload(new File([audio], "speech.mp3", { type: "audio/mpeg" }), {
      lifecycle: { expiresIn: "1h" },
    });
    await this.markProviderBillingStarted();
    const result = await client.subscribe(this.routing.endpointId, {
      input: {
        audio_url: audioUrl,
        batch_size: 64,
        chunk_level: "word",
        diarize: false,
        task: "transcribe",
      },
      logs: false,
    });
    return normalizeFalTranscript(result.data);
  }
}

function selectedProvider(config: WorkerConfig) {
  if (config.TRANSCRIPTION_PROVIDER !== "auto") return config.TRANSCRIPTION_PROVIDER;
  if (config.FAL_KEY) return "fal";
  if (config.TRANSCRIPTION_API_KEY) return "openai-compatible";
  return "local";
}

export function createTranscriptionProvider(
  config: WorkerConfig,
  markProviderBillingStarted: () => Promise<void>,
): TranscriptionProvider {
  const provider = selectedProvider(config);
  if (provider === "local") return new LocalTranscriptionProvider();
  if (provider === "fal") return new FalTranscriptionProvider(config, markProviderBillingStarted);
  return new OpenAICompatibleTranscriptionProvider(config, markProviderBillingStarted, provider);
}
