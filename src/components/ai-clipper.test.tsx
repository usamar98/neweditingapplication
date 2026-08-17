import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AIClipper, reconcileProjectJobs } from "@/components/ai-clipper";
import { defaultEditSettings, emptyAnalysis, emptyTranscript } from "@/lib/domain/video";
import type { ProjectEditorData } from "@/lib/data/projects";
import type { Tables } from "@/types/database.generated";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function project(overrides: Partial<ProjectEditorData> = {}): ProjectEditorData {
  return {
    analysis: emptyAnalysis,
    createdAt: "2026-08-17T10:00:00.000Z",
    duration: 0,
    editSettings: defaultEditSettings,
    exportUrl: null,
    id: "d0834428-78e9-4af7-b00c-75a146a23690",
    jobs: [],
    lastError: null,
    name: "Interview clips",
    previewUrl: "",
    sourceFilename: "youtube.com-video.mp4",
    sourceReady: false,
    status: "uploaded",
    thumbnailUrl: null,
    transcript: emptyTranscript,
    ...overrides,
  };
}

function job(overrides: Partial<Tables<"jobs">> = {}): Tables<"jobs"> {
  return {
    attempt: 0,
    created_at: "2026-08-17T10:00:00.000Z",
    dismissed_at: null,
    error_code: null,
    error_message: null,
    finished_at: null,
    generation_id: null,
    id: "10642b5a-419f-4c48-9ab2-ed50b4afc7d1",
    kind: "analyze",
    max_attempts: 3,
    payload: {},
    progress: 0,
    project_id: "d0834428-78e9-4af7-b00c-75a146a23690",
    queue_message_id: 25,
    result: {},
    stage: "Waiting for a worker",
    started_at: null,
    status: "queued",
    updated_at: "2026-08-17T10:00:00.000Z",
    user_id: "7b91a54f-c74e-448f-9ed5-32e6503f7b0c",
    ...overrides,
  };
}

describe("AIClipper", () => {
  it("replaces the endless import spinner with a recoverable cancelled state", () => {
    const html = renderToStaticMarkup(<AIClipper project={project()} />);

    expect(html).toContain("Video import was cancelled");
    expect(html).toContain("Remove &amp; choose another");
    expect(html).not.toContain("Securing your video source");
  });

  it("does not expose a fake 0.1-second range while duration is unknown", () => {
    const html = renderToStaticMarkup(<AIClipper project={project({ status: "analyzing" })} />);

    expect(html).toContain("Waiting for duration");
    expect(html).toContain("Range controls unlock after the real video duration is available.");
    expect(html).not.toContain('max="0.1"');
  });

  it("renders the real range once project metadata is available", () => {
    const html = renderToStaticMarkup(<AIClipper project={project({
      duration: 82.4,
      previewUrl: "https://example.supabase.co/storage/preview.mp4",
      sourceReady: true,
      status: "ready",
    })} />);

    expect(html).toContain("82.4s selected");
    expect(html).toContain('max="82.4"');
    expect(html).toContain('value="82.4"');
  });

  it("prefers a newer terminal server job over a stale queued client snapshot", () => {
    const queuedJob = job();
    const failedJob = job({
      error_code: "VIDEO_SOURCE_ACCESS_BLOCKED",
      error_message: "The source platform blocked server access.",
      finished_at: "2026-08-17T10:00:14.000Z",
      stage: "Linked video access blocked",
      status: "failed",
      updated_at: "2026-08-17T10:00:14.000Z",
    });

    expect(reconcileProjectJobs([failedJob], [queuedJob])).toEqual([failedJob]);
  });

  it("never shows a processing spinner after the project is terminal", () => {
    const html = renderToStaticMarkup(<AIClipper project={project({
      jobs: [job()],
      lastError: "The source platform blocked server access.",
      status: "failed",
    })} />);

    expect(html).toContain("Video import failed");
    expect(html).toContain("The source platform blocked server access.");
    expect(html).not.toContain("Securing your video source");
    expect(html).not.toContain("Waiting for a worker");
  });
});
