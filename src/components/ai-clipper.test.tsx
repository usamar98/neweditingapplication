import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AIClipper } from "@/components/ai-clipper";
import { defaultEditSettings, emptyAnalysis, emptyTranscript } from "@/lib/domain/video";
import type { ProjectEditorData } from "@/lib/data/projects";

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
});
