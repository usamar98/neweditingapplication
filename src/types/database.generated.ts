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
          current_period_end: string | null
          current_period_start: string | null
          latest_paid_invoice_id: string | null
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
          current_period_end?: string | null
          current_period_start?: string | null
          latest_paid_invoice_id?: string | null
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
          current_period_end?: string | null
          current_period_start?: string | null
          latest_paid_invoice_id?: string | null
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
      billing_plan_entitlements: {
        Row: {
          concurrency_limit: number
          hourly_generation_limit: number
          monthly_credits: number
          monthly_price_cents: number
          plan_key: string
          updated_at: string
        }
        Insert: {
          concurrency_limit: number
          hourly_generation_limit: number
          monthly_credits: number
          monthly_price_cents: number
          plan_key: string
          updated_at?: string
        }
        Update: {
          concurrency_limit?: number
          hourly_generation_limit?: number
          monthly_credits?: number
          monthly_price_cents?: number
          plan_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_revenue_events: {
        Row: {
          amount_paid_cents: number
          created_at: string
          currency: string
          id: number
          paid_at: string
          period_end: string
          period_start: string
          plan_key: string
          stripe_event_id: string
          stripe_invoice_id: string
          user_id: string
        }
        Insert: {
          amount_paid_cents: number
          created_at?: string
          currency: string
          id?: never
          paid_at: string
          period_end: string
          period_start: string
          plan_key: string
          stripe_event_id: string
          stripe_invoice_id: string
          user_id: string
        }
        Update: {
          amount_paid_cents?: number
          created_at?: string
          currency?: string
          id?: never
          paid_at?: string
          period_end?: string
          period_start?: string
          plan_key?: string
          stripe_event_id?: string
          stripe_invoice_id?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_accounts: {
        Row: {
          allocated_credits: number
          consumed_credits: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          plan_key: string
          reserved_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allocated_credits: number
          consumed_credits?: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          plan_key: string
          reserved_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allocated_credits?: number
          consumed_credits?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          plan_key?: string
          reserved_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          created_at: string
          credit_account_id: string
          credits_delta: number
          description: string
          entry_type: string
          id: number
          idempotency_key: string
          model_key: string | null
          provider_cost_micros: number
          reservation_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_account_id: string
          credits_delta: number
          description: string
          entry_type: string
          id?: never
          idempotency_key: string
          model_key?: string | null
          provider_cost_micros?: number
          reservation_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credit_account_id?: string
          credits_delta?: number
          description?: string
          entry_type?: string
          id?: never
          idempotency_key?: string
          model_key?: string | null
          provider_cost_micros?: number
          reservation_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_reservations: {
        Row: {
          actual_provider_cost_micros: number | null
          created_at: string
          credit_account_id: string
          credits_reserved: number
          estimated_provider_cost_micros: number
          failure_reason: string | null
          id: string
          idempotency_key: string
          job_id: string
          model_key: string
          operation_key: string
          pricing_version: string
          provider_started_at: string | null
          released_at: string | null
          settled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_provider_cost_micros?: number | null
          created_at?: string
          credit_account_id: string
          credits_reserved: number
          estimated_provider_cost_micros: number
          failure_reason?: string | null
          id?: string
          idempotency_key: string
          job_id: string
          model_key: string
          operation_key: string
          pricing_version: string
          provider_started_at?: string | null
          released_at?: string | null
          settled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_provider_cost_micros?: number | null
          created_at?: string
          credit_account_id?: string
          credits_reserved?: number
          estimated_provider_cost_micros?: number
          failure_reason?: string | null
          id?: string
          idempotency_key?: string
          job_id?: string
          model_key?: string
          operation_key?: string
          pricing_version?: string
          provider_started_at?: string | null
          released_at?: string | null
          settled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          country_code: string | null
          created_at: string
          last_seen_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          last_seen_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          last_seen_at?: string
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
      claim_welcome_credits: {
        Args: { p_user_id: string }
        Returns: Json
      }
      complete_job_with_credits: {
        Args: {
          p_actual_provider_cost_micros?: number
          p_job_id: string
          p_result: Json
          p_stage: string
        }
        Returns: Json
      }
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
      fail_job_with_credits: {
        Args: {
          p_attempt: number
          p_error_code: string
          p_error_message: string
          p_force_terminal?: boolean
          p_job_id: string
          p_stage: string
        }
        Returns: Json
      }
      get_my_credit_summary: { Args: never; Returns: Json }
      mark_job_provider_started: {
        Args: { p_job_id: string }
        Returns: boolean
      }
      queue_video_job: { Args: { message: Json }; Returns: number }
      reserve_job_credits: {
        Args: {
          p_credits: number
          p_estimated_provider_cost_micros: number
          p_idempotency_key: string
          p_job_id: string
          p_model_key: string
          p_operation_key: string
          p_pricing_version: string
          p_user_id: string
        }
        Returns: Json
      }
      sync_credit_period: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_plan_key: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      generation_kind:
        | "image"
        | "video"
        | "background_removal"
        | "performance_creative"
      job_kind:
        | "analyze"
        | "export"
        | "generate_image"
        | "generate_video"
        | "generate_background_removal"
        | "generate_performance_creative"
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
      generation_kind: [
        "image",
        "video",
        "background_removal",
        "performance_creative",
      ],
      job_kind: [
        "analyze",
        "export",
        "generate_image",
        "generate_video",
        "generate_background_removal",
        "generate_performance_creative",
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
