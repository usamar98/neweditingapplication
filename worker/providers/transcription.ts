import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { Transcript, TranscriptSegment, TranscriptWord } from "../../src/lib/domain/video";
import type { WorkerConfig } from "../config";

export interface TranscriptionProvider {
  readonly name: string;
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
  readonly name: string;

  constructor(private readonly config: WorkerConfig) {
    this.name = config.TRANSCRIPTION_PROVIDER;
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

export function createTranscriptionProvider(config: WorkerConfig): TranscriptionProvider {
  if (config.TRANSCRIPTION_PROVIDER === "local") return new LocalTranscriptionProvider();
  return new OpenAICompatibleTranscriptionProvider(config);
}
