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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agreements: {
        Row: {
          clauses: Json
          client_email: string
          created_at: string
          currency: string
          end_date: string | null
          fee: number
          id: string
          owner_id: string
          party_a: string
          party_b: string
          payment_schedule: string
          project_id: string | null
          quote_id: string | null
          scope: string
          signature_a: string
          signature_b: string
          start_date: string | null
          status: string
          title: string
        }
        Insert: {
          clauses?: Json
          client_email?: string
          created_at?: string
          currency?: string
          end_date?: string | null
          fee?: number
          id?: string
          owner_id?: string
          party_a?: string
          party_b?: string
          payment_schedule?: string
          project_id?: string | null
          quote_id?: string | null
          scope?: string
          signature_a?: string
          signature_b?: string
          start_date?: string | null
          status?: string
          title?: string
        }
        Update: {
          clauses?: Json
          client_email?: string
          created_at?: string
          currency?: string
          end_date?: string | null
          fee?: number
          id?: string
          owner_id?: string
          party_a?: string
          party_b?: string
          payment_schedule?: string
          project_id?: string | null
          quote_id?: string | null
          scope?: string
          signature_a?: string
          signature_b?: string
          start_date?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_state: {
        Row: {
          failures: number
          last_error: string | null
          last_run_at: string | null
          lease_until: string | null
          name: string
          paused: boolean
        }
        Insert: {
          failures?: number
          last_error?: string | null
          last_run_at?: string | null
          lease_until?: string | null
          name: string
          paused?: boolean
        }
        Update: {
          failures?: number
          last_error?: string | null
          last_run_at?: string | null
          lease_until?: string | null
          name?: string
          paused?: boolean
        }
        Relationships: []
      }
      members: {
        Row: {
          color_id: string
          created_at: string
          email: string
          id: string
          name: string
          owner_id: string
          role: string
          title: string
        }
        Insert: {
          color_id?: string
          created_at?: string
          email?: string
          id?: string
          name: string
          owner_id?: string
          role?: string
          title?: string
        }
        Update: {
          color_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          owner_id?: string
          role?: string
          title?: string
        }
        Relationships: []
      }
      payment_milestones: {
        Row: {
          agreement_id: string | null
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          id: string
          label: string
          owner_id: string
          paid: boolean
          paid_at: string | null
          project_id: string | null
          quote_id: string | null
        }
        Insert: {
          agreement_id?: string | null
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          label?: string
          owner_id?: string
          paid?: boolean
          paid_at?: string | null
          project_id?: string | null
          quote_id?: string | null
        }
        Update: {
          agreement_id?: string | null
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          label?: string
          owner_id?: string
          paid?: boolean
          paid_at?: string | null
          project_id?: string | null
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestones_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_milestones_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          quote_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          quote_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          description: string
          id: string
          owner_id: string
          position: number
          quantity: number
          quote_id: string
          rate: number
          tax: number
        }
        Insert: {
          description?: string
          id?: string
          owner_id?: string
          position?: number
          quantity?: number
          quote_id: string
          rate?: number
          tax?: number
        }
        Update: {
          description?: string
          id?: string
          owner_id?: string
          position?: number
          quantity?: number
          quote_id?: string
          rate?: number
          tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_address: string
          client_company: string
          client_email: string
          client_name: string
          created_at: string
          currency: string
          discount: number
          id: string
          issue_date: string | null
          notes: string
          number: string
          owner_id: string
          project_id: string | null
          status: string
          terms: string
          valid_until: string | null
        }
        Insert: {
          client_address?: string
          client_company?: string
          client_email?: string
          client_name?: string
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          issue_date?: string | null
          notes?: string
          number?: string
          owner_id?: string
          project_id?: string | null
          status?: string
          terms?: string
          valid_until?: string | null
        }
        Update: {
          client_address?: string
          client_company?: string
          client_email?: string
          client_name?: string
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          issue_date?: string | null
          notes?: string
          number?: string
          owner_id?: string
          project_id?: string | null
          status?: string
          terms?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_settings: {
        Row: {
          created_at: string
          daily_enabled: boolean
          daily_time: string
          payment_enabled: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_enabled?: boolean
          daily_time?: string
          payment_enabled?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          daily_enabled?: boolean
          daily_time?: string
          payment_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string
          due_at: string
          id: string
          kind: string
          milestone_id: string | null
          owner_id: string
          sent_at: string | null
          status: string
          task_id: string | null
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          dedupe_key: string
          due_at?: string
          id?: string
          kind: string
          milestone_id?: string | null
          owner_id?: string
          sent_at?: string | null
          status?: string
          task_id?: string | null
          title?: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string
          due_at?: string
          id?: string
          kind?: string
          milestone_id?: string | null
          owner_id?: string
          sent_at?: string | null
          status?: string
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "payment_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          id: string
          label: string
          owner_id: string
          position: number
          project_id: string
        }
        Insert: {
          id?: string
          label: string
          owner_id?: string
          position?: number
          project_id: string
        }
        Update: {
          id?: string
          label?: string
          owner_id?: string
          position?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          created_at: string
          id: string
          note: string
          owner_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          owner_id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          owner_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          description: string
          due: string | null
          id: string
          last_update_at: string
          logged: number
          member_id: string | null
          owner_id: string
          priority: string
          project_id: string
          remaining: number
          stage_id: string
          tag: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string
          due?: string | null
          id?: string
          last_update_at?: string
          logged?: number
          member_id?: string | null
          owner_id?: string
          priority?: string
          project_id: string
          remaining?: number
          stage_id: string
          tag?: string
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          due?: string | null
          id?: string
          last_update_at?: string
          logged?: number
          member_id?: string | null
          owner_id?: string
          priority?: string
          project_id?: string
          remaining?: number
          stage_id?: string
          tag?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_reminders: { Args: never; Returns: undefined }
      seed_workspace: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
