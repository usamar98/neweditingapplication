export const MIN_CLIP_DURATION_SECONDS = 0.1;

const TIME_EPSILON_SECONDS = 0.001;
const TIME_PRECISION = 1_000;

export type ClipRange = {
  end: number;
  start: number;
};

function roundTime(value: number) {
  return Math.round(value * TIME_PRECISION) / TIME_PRECISION;
}

function finiteNumber(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeMediaDuration(value: number | null | undefined) {
  const duration = finiteNumber(value, 0);
  return duration > 0 ? roundTime(duration) : null;
}

export function normalizeClipRange({
  duration: durationValue,
  end: endValue,
  start: startValue,
}: {
  duration: number;
  end: number | null | undefined;
  start: number | null | undefined;
}): ClipRange {
  const duration = normalizeMediaDuration(durationValue);
  if (duration === null) return { end: 0, start: 0 };

  const minimumLength = Math.min(MIN_CLIP_DURATION_SECONDS, duration);
  const maximumStart = Math.max(0, duration - minimumLength);
  const start = roundTime(Math.min(maximumStart, Math.max(0, finiteNumber(startValue, 0))));
  const end = roundTime(Math.min(
    duration,
    Math.max(start + minimumLength, finiteNumber(endValue, duration)),
  ));

  return { end, start };
}

export function clipRangeValidationError({
  duration: durationValue,
  end: endValue,
  start,
}: {
  duration: number | null | undefined;
  end: number | null | undefined;
  start: number;
}) {
  const duration = normalizeMediaDuration(durationValue);
  if (duration === null) return null;
  if (!Number.isFinite(start) || start < 0) return "Clip start must be zero or greater.";
  if (start >= duration - TIME_EPSILON_SECONDS) return "Clip start must be before the end of the video.";

  const end = endValue ?? duration;
  if (!Number.isFinite(end)) return "Clip end must be a valid time.";
  if (end > duration + TIME_EPSILON_SECONDS) return "Clip end exceeds the video duration.";
  if (end - start < Math.min(MIN_CLIP_DURATION_SECONDS, duration) - TIME_EPSILON_SECONDS) {
    return `Select at least ${MIN_CLIP_DURATION_SECONDS.toFixed(1)} seconds.`;
  }
  return null;
}
