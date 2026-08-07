// Generated-style Supabase Database definitions for the schema in
// supabase/migrations/20260807115631_create_video_platform.sql.
// Regenerate from a running project with: npm run db:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          plan: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          plan?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          plan?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          analysis: Json;
          created_at: string;
          duration_seconds: number | null;
          edit_settings: Json;
          export_path: string | null;
          frame_rate: number | null;
          height: number | null;
          id: string;
          last_error: string | null;
          name: string;
          source_filename: string;
          source_mime: string;
          source_path: string;
          source_size_bytes: number;
          status: Database["public"]["Enums"]["project_status"];
          thumbnail_path: string | null;
          transcript: Json;
          updated_at: string;
          user_id: string;
          width: number | null;
        };
        Insert: {
          analysis?: Json;
          created_at?: string;
          duration_seconds?: number | null;
          edit_settings?: Json;
          export_path?: string | null;
          frame_rate?: number | null;
          height?: number | null;
          id?: string;
          last_error?: string | null;
          name: string;
          source_filename: string;
          source_mime: string;
          source_path: string;
          source_size_bytes: number;
          status?: Database["public"]["Enums"]["project_status"];
          thumbnail_path?: string | null;
          transcript?: Json;
          updated_at?: string;
          user_id: string;
          width?: number | null;
        };
        Update: {
          analysis?: Json;
          created_at?: string;
          duration_seconds?: number | null;
          edit_settings?: Json;
          export_path?: string | null;
          frame_rate?: number | null;
          height?: number | null;
          id?: string;
          last_error?: string | null;
          name?: string;
          source_filename?: string;
          source_mime?: string;
          source_path?: string;
          source_size_bytes?: number;
          status?: Database["public"]["Enums"]["project_status"];
          thumbnail_path?: string | null;
          transcript?: Json;
          updated_at?: string;
          user_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          attempt: number;
          created_at: string;
          error_code: string | null;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          kind: Database["public"]["Enums"]["job_kind"];
          max_attempts: number;
          payload: Json;
          progress: number;
          project_id: string;
          queue_message_id: number | null;
          result: Json;
          stage: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["job_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempt?: number;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["job_kind"];
          max_attempts?: number;
          payload?: Json;
          progress?: number;
          project_id: string;
          queue_message_id?: number | null;
          result?: Json;
          stage?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempt?: number;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["job_kind"];
          max_attempts?: number;
          payload?: Json;
          progress?: number;
          project_id?: string;
          queue_message_id?: number | null;
          result?: Json;
          stage?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      request_counters: {
        Row: {
          request_count: number;
          scope: string;
          updated_at: string;
          user_id: string;
          window_started_at: string;
        };
        Insert: {
          request_count?: number;
          scope: string;
          updated_at?: string;
          user_id: string;
          window_started_at: string;
        };
        Update: {
          request_count?: number;
          scope?: string;
          updated_at?: string;
          user_id?: string;
          window_started_at?: string;
        };
        Relationships: [];
      };
      usage_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: number;
          job_id: string | null;
          metadata: Json;
          project_id: string | null;
          units: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: never;
          job_id?: string | null;
          metadata?: Json;
          project_id?: string | null;
          units: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: never;
          job_id?: string | null;
          metadata?: Json;
          project_id?: string | null;
          units?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_events_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      archive_video_job: {
        Args: { message_id: number };
        Returns: boolean;
      };
      consume_rate_limit: {
        Args: {
          request_limit: number;
          scope_name: string;
          window_seconds: number;
        };
        Returns: boolean;
      };
      dequeue_video_jobs: {
        Args: { batch_size?: number; visibility_timeout?: number };
        Returns: {
          enqueued_at: string;
          message: Json;
          msg_id: number;
          read_ct: number;
          vt: string;
        }[];
      };
      queue_video_job: {
        Args: { message: Json };
        Returns: number;
      };
    };
    Enums: {
      job_kind: "analyze" | "export";
      job_status:
        | "queued"
        | "processing"
        | "retrying"
        | "completed"
        | "failed"
        | "cancelled";
      project_status:
        | "uploading"
        | "uploaded"
        | "analyzing"
        | "ready"
        | "exporting"
        | "completed"
        | "failed";
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];
