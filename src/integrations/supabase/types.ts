export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agreements: {
        Row: {
          id: string
          owner_id: string
          title: string
          party_a: string
          party_b: string
          client_email: string
          scope: string
          start_date: string | null
          end_date: string | null
          fee: number
          currency: string
          payment_schedule: string
          clauses: Json
          signature_a: string
          signature_b: string
          status: string
          project_id: string | null
          quote_id: string | null
          created_at: string
          company_id: string
        }
        Insert: {
          id?: string
          owner_id?: string
          title?: string
          party_a?: string
          party_b?: string
          client_email?: string
          scope?: string
          start_date?: string | null
          end_date?: string | null
          fee?: number
          currency?: string
          payment_schedule?: string
          clauses?: Json
          signature_a?: string
          signature_b?: string
          status?: string
          project_id?: string | null
          quote_id?: string | null
          created_at?: string
          company_id?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          party_a?: string
          party_b?: string
          client_email?: string
          scope?: string
          start_date?: string | null
          end_date?: string | null
          fee?: number
          currency?: string
          payment_schedule?: string
          clauses?: Json
          signature_a?: string
          signature_b?: string
          status?: string
          project_id?: string | null
          quote_id?: string | null
          created_at?: string
          company_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: string
          title: string
          color_id: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role?: string
          title?: string
          color_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: string
          title?: string
          color_id?: string
          created_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          company_id: string
          email: string
          role: string
          title: string
          color_id: string
          invited_by: string
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          email: string
          role?: string
          title?: string
          color_id?: string
          invited_by?: string
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          role?: string
          title?: string
          color_id?: string
          invited_by?: string
          created_at?: string
          accepted_at?: string | null
        }
        Relationships: []
      }
      job_state: {
        Row: {
          name: string
          paused: boolean
          failures: number
          lease_until: string | null
          last_run_at: string | null
          last_error: string | null
        }
        Insert: {
          name: string
          paused?: boolean
          failures?: number
          lease_until?: string | null
          last_run_at?: string | null
          last_error?: string | null
        }
        Update: {
          name?: string
          paused?: boolean
          failures?: number
          lease_until?: string | null
          last_run_at?: string | null
          last_error?: string | null
        }
        Relationships: []
      }
      lead_counts: {
        Row: {
          id: string
          company_id: string
          project_id: string
          day: string
          count: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string
          project_id: string
          day?: string
          count?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          project_id?: string
          day?: string
          count?: number
          created_at?: string
        }
        Relationships: []
      }
      payment_milestones: {
        Row: {
          id: string
          owner_id: string
          label: string
          amount: number
          currency: string
          due_date: string | null
          paid: boolean
          paid_at: string | null
          quote_id: string | null
          agreement_id: string | null
          project_id: string | null
          created_at: string
          company_id: string
        }
        Insert: {
          id?: string
          owner_id?: string
          label?: string
          amount?: number
          currency?: string
          due_date?: string | null
          paid?: boolean
          paid_at?: string | null
          quote_id?: string | null
          agreement_id?: string | null
          project_id?: string | null
          created_at?: string
          company_id?: string
        }
        Update: {
          id?: string
          owner_id?: string
          label?: string
          amount?: number
          currency?: string
          due_date?: string | null
          paid?: boolean
          paid_at?: string | null
          quote_id?: string | null
          agreement_id?: string | null
          project_id?: string | null
          created_at?: string
          company_id?: string
        }
        Relationships: []
      }
      planner_days: {
        Row: {
          id: string
          user_id: string
          day: string
          created_at: string
          updated_at: string
          content: Json
        }
        Insert: {
          id?: string
          user_id?: string
          day?: string
          created_at?: string
          updated_at?: string
          content?: Json
        }
        Update: {
          id?: string
          user_id?: string
          day?: string
          created_at?: string
          updated_at?: string
          content?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          name: string
          quote_id: string | null
          created_at: string
          company_id: string
          kind: string
        }
        Insert: {
          id?: string
          owner_id?: string
          name: string
          quote_id?: string | null
          created_at?: string
          company_id?: string
          kind?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          quote_id?: string | null
          created_at?: string
          company_id?: string
          kind?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          id: string
          owner_id: string
          quote_id: string
          description: string
          quantity: number
          rate: number
          tax: number
          position: number
          company_id: string
          name: string
          qty_text: string
          amount_text: string
        }
        Insert: {
          id?: string
          owner_id?: string
          quote_id: string
          description?: string
          quantity?: number
          rate?: number
          tax?: number
          position?: number
          company_id?: string
          name?: string
          qty_text?: string
          amount_text?: string
        }
        Update: {
          id?: string
          owner_id?: string
          quote_id?: string
          description?: string
          quantity?: number
          rate?: number
          tax?: number
          position?: number
          company_id?: string
          name?: string
          qty_text?: string
          amount_text?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          id: string
          owner_id: string
          number: string
          client_name: string
          client_company: string
          client_email: string
          client_address: string
          issue_date: string | null
          valid_until: string | null
          currency: string
          discount: number
          notes: string
          terms: string
          status: string
          project_id: string | null
          created_at: string
          company_id: string
          deposit: number
          summary: Json
          plans: Json
          payment_details: string
        }
        Insert: {
          id?: string
          owner_id?: string
          number?: string
          client_name?: string
          client_company?: string
          client_email?: string
          client_address?: string
          issue_date?: string | null
          valid_until?: string | null
          currency?: string
          discount?: number
          notes?: string
          terms?: string
          status?: string
          project_id?: string | null
          created_at?: string
          company_id?: string
          deposit?: number
          summary?: Json
          plans?: Json
          payment_details?: string
        }
        Update: {
          id?: string
          owner_id?: string
          number?: string
          client_name?: string
          client_company?: string
          client_email?: string
          client_address?: string
          issue_date?: string | null
          valid_until?: string | null
          currency?: string
          discount?: number
          notes?: string
          terms?: string
          status?: string
          project_id?: string | null
          created_at?: string
          company_id?: string
          deposit?: number
          summary?: Json
          plans?: Json
          payment_details?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          user_id: string
          daily_enabled: boolean
          daily_time: string
          payment_enabled: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          daily_enabled?: boolean
          daily_time?: string
          payment_enabled?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          daily_enabled?: boolean
          daily_time?: string
          payment_enabled?: boolean
          created_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          id: string
          owner_id: string
          kind: string
          title: string
          body: string
          due_at: string
          status: string
          sent_at: string | null
          task_id: string | null
          milestone_id: string | null
          dedupe_key: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          kind: string
          title?: string
          body?: string
          due_at?: string
          status?: string
          sent_at?: string | null
          task_id?: string | null
          milestone_id?: string | null
          dedupe_key: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          kind?: string
          title?: string
          body?: string
          due_at?: string
          status?: string
          sent_at?: string | null
          task_id?: string | null
          milestone_id?: string | null
          dedupe_key?: string
          created_at?: string
        }
        Relationships: []
      }
      stages: {
        Row: {
          id: string
          owner_id: string
          project_id: string
          label: string
          position: number
          company_id: string
        }
        Insert: {
          id?: string
          owner_id?: string
          project_id: string
          label: string
          position?: number
          company_id?: string
        }
        Update: {
          id?: string
          owner_id?: string
          project_id?: string
          label?: string
          position?: number
          company_id?: string
        }
        Relationships: []
      }
      task_updates: {
        Row: {
          id: string
          owner_id: string
          task_id: string
          note: string
          created_at: string
          company_id: string
        }
        Insert: {
          id?: string
          owner_id?: string
          task_id: string
          note?: string
          created_at?: string
          company_id?: string
        }
        Update: {
          id?: string
          owner_id?: string
          task_id?: string
          note?: string
          created_at?: string
          company_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          owner_id: string
          project_id: string
          stage_id: string
          title: string
          description: string
          tag: string
          member_id: string | null
          due: string | null
          priority: string
          logged: number
          remaining: number
          created_by: string
          last_update_at: string
          created_at: string
          company_id: string
        }
        Insert: {
          id?: string
          owner_id?: string
          project_id: string
          stage_id: string
          title?: string
          description?: string
          tag?: string
          member_id?: string | null
          due?: string | null
          priority?: string
          logged?: number
          remaining?: number
          created_by?: string
          last_update_at?: string
          created_at?: string
          company_id?: string
        }
        Update: {
          id?: string
          owner_id?: string
          project_id?: string
          stage_id?: string
          title?: string
          description?: string
          tag?: string
          member_id?: string | null
          due?: string | null
          priority?: string
          logged?: number
          remaining?: number
          created_by?: string
          last_update_at?: string
          created_at?: string
          company_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_company: {
        Args: { p_name: string }
        Returns: string
      }
      accept_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      current_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
