alter type public.job_kind add value if not exists 'generate_performance_creative';
alter type public.generation_kind add value if not exists 'performance_creative';

begin;

alter table public.usage_events drop constraint usage_events_event_type_check;
alter table public.usage_events
  add constraint usage_events_event_type_check
  check (event_type in (
    'upload_bytes',
    'video_seconds_analyzed',
    'video_seconds_exported',
    'ai_transcription_seconds',
    'ai_analysis_request',
    'ai_image_generation',
    'ai_video_generation',
    'background_removal',
    'performance_creative'
  ));

commit;
