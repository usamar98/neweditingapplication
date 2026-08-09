export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      billing_accounts: {
        Row: {
          cancel_at_period_end: boolean
          plan_key: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          plan_key?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          plan_key?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          created_at: string
          duration_seconds: number | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["generation_kind"]
          last_error: string | null
          model_endpoint: string | null
          name: string
          output_bucket: string | null
          output_mime: string | null
          output_path: string | null
          prompt: string
          routing_profile: string
          routing_reason: string | null
          seed: number | null
          settings: Json
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["generation_kind"]
          last_error?: string | null
          model_endpoint?: string | null
          name: string
          output_bucket?: string | null
          output_mime?: string | null
          output_path?: string | null
          prompt: string
          routing_profile?: string
          routing_reason?: string | null
          seed?: number | null
          settings?: Json
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["generation_kind"]
          last_error?: string | null
          model_endpoint?: string | null
          name?: string
          output_bucket?: string | null
          output_mime?: string | null
          output_path?: string | null
          prompt?: string
          routing_profile?: string
          routing_reason?: string | null
          seed?: number | null
          settings?: Json
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          attempt: number
          created_at: string
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          generation_id: string | null
          id: string
          kind: Database["public"]["Enums"]["job_kind"]
          max_attempts: number
          payload: Json
          progress: number
          project_id: string | null
          queue_message_id: number | null
          result: Json
          stage: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          generation_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["job_kind"]
          max_attempts?: number
          payload?: Json
          progress?: number
          project_id?: string | null
          queue_message_id?: number | null
          result?: Json
          stage?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          generation_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["job_kind"]
          max_attempts?: number
          payload?: Json
          progress?: number
          project_id?: string | null
          queue_message_id?: number | null
          result?: Json
          stage?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          deactivated_at: string | null
          display_name: string | null
          id: string
          plan: string
          updated_at: string
          username: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          id: string
          plan?: string
          updated_at?: string
          username: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          id?: string
          plan?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          analysis: Json
          created_at: string
          duration_seconds: number | null
          edit_settings: Json
          export_path: string | null
          frame_rate: number | null
          height: number | null
          id: string
          last_error: string | null
          name: string
          source_filename: string
          source_mime: string
          source_path: string
          source_size_bytes: number
          status: Database["public"]["Enums"]["project_status"]
          thumbnail_path: string | null
          transcript: Json
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          analysis?: Json
          created_at?: string
          duration_seconds?: number | null
          edit_settings?: Json
          export_path?: string | null
          frame_rate?: number | null
          height?: number | null
          id?: string
          last_error?: string | null
          name: string
          source_filename: string
          source_mime: string
          source_path: string
          source_size_bytes: number
          status?: Database["public"]["Enums"]["project_status"]
          thumbnail_path?: string | null
          transcript?: Json
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          analysis?: Json
          created_at?: string
          duration_seconds?: number | null
          edit_settings?: Json
          export_path?: string | null
          frame_rate?: number | null
          height?: number | null
          id?: string
          last_error?: string | null
          name?: string
          source_filename?: string
          source_mime?: string
          source_path?: string
          source_size_bytes?: number
          status?: Database["public"]["Enums"]["project_status"]
          thumbnail_path?: string | null
          transcript?: Json
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      request_counters: {
        Row: {
          request_count: number
          scope: string
          updated_at: string
          user_id: string
          window_started_at: string
        }
        Insert: {
          request_count?: number
          scope: string
          updated_at?: string
          user_id: string
          window_started_at: string
        }
        Update: {
          request_count?: number
          scope?: string
          updated_at?: string
          user_id?: string
          window_started_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          event_type: string
          generation_id: string | null
          id: number
          job_id: string | null
          metadata: Json
          project_id: string | null
          units: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          generation_id?: string | null
          id?: never
          job_id?: string | null
          metadata?: Json
          project_id?: string | null
          units: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          generation_id?: string | null
          id?: never
          job_id?: string | null
          metadata?: Json
          project_id?: string | null
          units?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_video_job: { Args: { message_id: number }; Returns: boolean }
      consume_rate_limit: {
        Args: {
          request_limit: number
          scope_name: string
          window_seconds: number
        }
        Returns: boolean
      }
      dequeue_video_jobs: {
        Args: { batch_size?: number; visibility_timeout?: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          vt: string
        }[]
      }
      queue_video_job: { Args: { message: Json }; Returns: number }
    }
    Enums: {
      generation_kind: "image" | "video" | "background_removal"
      job_kind:
        | "analyze"
        | "export"
        | "generate_image"
        | "generate_video"
        | "generate_background_removal"
      job_status:
        | "queued"
        | "processing"
        | "retrying"
        | "completed"
        | "failed"
        | "cancelled"
      project_status:
        | "uploading"
        | "uploaded"
        | "analyzing"
        | "ready"
        | "exporting"
        | "completed"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      generation_kind: ["image", "video", "background_removal"],
      job_kind: [
        "analyze",
        "export",
        "generate_image",
        "generate_video",
        "generate_background_removal",
      ],
      job_status: [
        "queued",
        "processing",
        "retrying",
        "completed",
        "failed",
        "cancelled",
      ],
      project_status: [
        "uploading",
        "uploaded",
        "analyzing",
        "ready",
        "exporting",
        "completed",
        "failed",
      ],
    },
  },
} as const
