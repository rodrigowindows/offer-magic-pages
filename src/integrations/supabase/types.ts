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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_test_events: {
        Row: {
          event: string
          id: string
          metadata: Json | null
          property_id: string | null
          session_id: string
          timestamp: string
          variant: string
        }
        Insert: {
          event: string
          id?: string
          metadata?: Json | null
          property_id?: string | null
          session_id: string
          timestamp?: string
          variant: string
        }
        Update: {
          event?: string
          id?: string
          metadata?: Json | null
          property_id?: string | null
          session_id?: string
          timestamp?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          created_at: string
          id: string
          property_id: string
          session_id: string
          source: string | null
          submitted_form: boolean | null
          time_on_page: number | null
          variant: string
          viewed_benefits: boolean | null
          viewed_form: boolean | null
          viewed_hero: boolean | null
          viewed_offer: boolean | null
          viewed_process: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          session_id: string
          source?: string | null
          submitted_form?: boolean | null
          time_on_page?: number | null
          variant: string
          viewed_benefits?: boolean | null
          viewed_form?: boolean | null
          viewed_hero?: boolean | null
          viewed_offer?: boolean | null
          viewed_process?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          session_id?: string
          source?: string | null
          submitted_form?: boolean | null
          time_on_page?: number | null
          variant?: string
          viewed_benefits?: boolean | null
          viewed_form?: boolean | null
          viewed_hero?: boolean | null
          viewed_offer?: boolean | null
          viewed_process?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      call_settings: {
        Row: {
          api_endpoint: string
          api_key: string | null
          created_at: string | null
          headers: Json | null
          http_method: string
          id: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          api_key?: string | null
          created_at?: string | null
          headers?: Json | null
          http_method?: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          api_key?: string | null
          created_at?: string | null
          headers?: Json | null
          http_method?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      campaign_logs: {
        Row: {
          api_response: Json | null
          api_status: number | null
          campaign_type: string
          channel: string | null
          click_count: number | null
          clicked_at: string | null
          first_response_at: string | null
          id: string
          link_clicked: boolean | null
          metadata: Json | null
          property_address: string | null
          property_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          response_time_seconds: number | null
          sent_at: string
          tracking_id: string
        }
        Insert: {
          api_response?: Json | null
          api_status?: number | null
          campaign_type?: string
          channel?: string | null
          click_count?: number | null
          clicked_at?: string | null
          first_response_at?: string | null
          id?: string
          link_clicked?: boolean | null
          metadata?: Json | null
          property_address?: string | null
          property_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          response_time_seconds?: number | null
          sent_at?: string
          tracking_id?: string
        }
        Update: {
          api_response?: Json | null
          api_status?: number | null
          campaign_type?: string
          channel?: string | null
          click_count?: number | null
          clicked_at?: string | null
          first_response_at?: string | null
          id?: string
          link_clicked?: boolean | null
          metadata?: Json | null
          property_address?: string | null
          property_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          response_time_seconds?: number | null
          sent_at?: string
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_templates: {
        Row: {
          api_endpoint: string | null
          created_at: string
          headers: Json | null
          id: string
          is_default: boolean | null
          message_template: string | null
          name: string
          seller_name: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          headers?: Json | null
          id?: string
          is_default?: boolean | null
          message_template?: string | null
          name: string
          seller_name?: string | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          headers?: Json | null
          id?: string
          is_default?: boolean | null
          message_template?: string | null
          name?: string
          seller_name?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          id: string
          opened_at: string | null
          opened_count: number
          property_id: string
          recipient_email: string
          sent_at: string
          subject: string
          tracking_id: string
        }
        Insert: {
          id?: string
          opened_at?: string | null
          opened_count?: number
          property_id: string
          recipient_email: string
          sent_at?: string
          subject: string
          tracking_id?: string
        }
        Update: {
          id?: string
          opened_at?: string | null
          opened_count?: number
          property_id?: string
          recipient_email?: string
          sent_at?: string
          subject?: string
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          api_endpoint: string
          api_key: string | null
          created_at: string | null
          headers: Json | null
          http_method: string
          id: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          api_key?: string | null
          created_at?: string | null
          headers?: Json | null
          http_method?: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          api_key?: string | null
          created_at?: string | null
          headers?: Json | null
          http_method?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      follow_up_reminders: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          id: string
          is_completed: boolean | null
          notes: string | null
          property_id: string
          reminder_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          property_id: string
          reminder_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          property_id?: string
          reminder_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          property_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          property_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_leads: {
        Row: {
          account_number: string
          appears_vacant: boolean | null
          baths: number | null
          beds: number | null
          condition_category: string | null
          condition_score: number | null
          created_at: string | null
          distress_indicators: string | null
          equity_estimate: number | null
          estimated_repair_cost_high: number | null
          estimated_repair_cost_low: number | null
          exemptions: string | null
          exterior_condition: string | null
          id: number
          image_url: string | null
          is_estate: boolean | null
          is_out_of_state: boolean | null
          is_vacant_land: boolean | null
          just_value: number | null
          lawn_condition: string | null
          lead_score: number | null
          lot_size: number | null
          mailing_address: string | null
          mailing_city: string | null
          mailing_state: string | null
          mailing_zip: string | null
          owner_name: string | null
          priority_tier: string | null
          property_address: string | null
          property_type: string | null
          roof_condition: string | null
          sqft: number | null
          taxable_value: number | null
          total_tax_due: number | null
          updated_at: string | null
          visible_issues: string | null
          visual_summary: string | null
          year_built: number | null
          years_delinquent: number | null
        }
        Insert: {
          account_number: string
          appears_vacant?: boolean | null
          baths?: number | null
          beds?: number | null
          condition_category?: string | null
          condition_score?: number | null
          created_at?: string | null
          distress_indicators?: string | null
          equity_estimate?: number | null
          estimated_repair_cost_high?: number | null
          estimated_repair_cost_low?: number | null
          exemptions?: string | null
          exterior_condition?: string | null
          id?: number
          image_url?: string | null
          is_estate?: boolean | null
          is_out_of_state?: boolean | null
          is_vacant_land?: boolean | null
          just_value?: number | null
          lawn_condition?: string | null
          lead_score?: number | null
          lot_size?: number | null
          mailing_address?: string | null
          mailing_city?: string | null
          mailing_state?: string | null
          mailing_zip?: string | null
          owner_name?: string | null
          priority_tier?: string | null
          property_address?: string | null
          property_type?: string | null
          roof_condition?: string | null
          sqft?: number | null
          taxable_value?: number | null
          total_tax_due?: number | null
          updated_at?: string | null
          visible_issues?: string | null
          visual_summary?: string | null
          year_built?: number | null
          years_delinquent?: number | null
        }
        Update: {
          account_number?: string
          appears_vacant?: boolean | null
          baths?: number | null
          beds?: number | null
          condition_category?: string | null
          condition_score?: number | null
          created_at?: string | null
          distress_indicators?: string | null
          equity_estimate?: number | null
          estimated_repair_cost_high?: number | null
          estimated_repair_cost_low?: number | null
          exemptions?: string | null
          exterior_condition?: string | null
          id?: number
          image_url?: string | null
          is_estate?: boolean | null
          is_out_of_state?: boolean | null
          is_vacant_land?: boolean | null
          just_value?: number | null
          lawn_condition?: string | null
          lead_score?: number | null
          lot_size?: number | null
          mailing_address?: string | null
          mailing_city?: string | null
          mailing_state?: string | null
          mailing_zip?: string | null
          owner_name?: string | null
          priority_tier?: string | null
          property_address?: string | null
          property_type?: string | null
          roof_condition?: string | null
          sqft?: number | null
          taxable_value?: number | null
          total_tax_due?: number | null
          updated_at?: string | null
          visible_issues?: string | null
          visual_summary?: string | null
          year_built?: number | null
          years_delinquent?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          airbnb_check_date: string | null
          airbnb_eligible: boolean | null
          airbnb_notes: string | null
          airbnb_regulations: Json | null
          answer_flag: boolean | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          bathrooms: number | null
          bedrooms: number | null
          card_sent: boolean
          carta: string | null
          cash_offer_amount: number
          city: string
          comparative_price: number | null
          county: string | null
          created_at: string
          dnc_flag: boolean | null
          email_sent: boolean
          estimated_value: number
          evaluation: string | null
          focar: string | null
          id: string
          import_batch: string | null
          import_date: string | null
          last_contact_date: string | null
          lead_captured: boolean | null
          lead_captured_at: string | null
          lead_score: number | null
          lead_status: string
          letter_sent: boolean
          lot_size: number | null
          meeting_scheduled: boolean
          neighborhood: string | null
          next_followup_date: string | null
          origem: string | null
          owner_address: string | null
          owner_name: string | null
          owner_phone: string | null
          phone_call_made: boolean
          property_image_url: string | null
          property_type: string | null
          rejection_notes: string | null
          rejection_reason: string | null
          slug: string
          sms_sent: boolean
          square_feet: number | null
          state: string
          status: string
          tags: string[] | null
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
          year_built: number | null
          zillow_url: string | null
          zip_code: string
        }
        Insert: {
          address: string
          airbnb_check_date?: string | null
          airbnb_eligible?: boolean | null
          airbnb_notes?: string | null
          airbnb_regulations?: Json | null
          answer_flag?: boolean | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          card_sent?: boolean
          carta?: string | null
          cash_offer_amount: number
          city?: string
          comparative_price?: number | null
          county?: string | null
          created_at?: string
          dnc_flag?: boolean | null
          email_sent?: boolean
          estimated_value: number
          evaluation?: string | null
          focar?: string | null
          id?: string
          import_batch?: string | null
          import_date?: string | null
          last_contact_date?: string | null
          lead_captured?: boolean | null
          lead_captured_at?: string | null
          lead_score?: number | null
          lead_status?: string
          letter_sent?: boolean
          lot_size?: number | null
          meeting_scheduled?: boolean
          neighborhood?: string | null
          next_followup_date?: string | null
          origem?: string | null
          owner_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          phone_call_made?: boolean
          property_image_url?: string | null
          property_type?: string | null
          rejection_notes?: string | null
          rejection_reason?: string | null
          slug: string
          sms_sent?: boolean
          square_feet?: number | null
          state?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          year_built?: number | null
          zillow_url?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          airbnb_check_date?: string | null
          airbnb_eligible?: boolean | null
          airbnb_notes?: string | null
          airbnb_regulations?: Json | null
          answer_flag?: boolean | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          card_sent?: boolean
          carta?: string | null
          cash_offer_amount?: number
          city?: string
          comparative_price?: number | null
          county?: string | null
          created_at?: string
          dnc_flag?: boolean | null
          email_sent?: boolean
          estimated_value?: number
          evaluation?: string | null
          focar?: string | null
          id?: string
          import_batch?: string | null
          import_date?: string | null
          last_contact_date?: string | null
          lead_captured?: boolean | null
          lead_captured_at?: string | null
          lead_score?: number | null
          lead_status?: string
          letter_sent?: boolean
          lot_size?: number | null
          meeting_scheduled?: boolean
          neighborhood?: string | null
          next_followup_date?: string | null
          origem?: string | null
          owner_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          phone_call_made?: boolean
          property_image_url?: string | null
          property_type?: string | null
          rejection_notes?: string | null
          rejection_reason?: string | null
          slug?: string
          sms_sent?: boolean
          square_feet?: number | null
          state?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          year_built?: number | null
          zillow_url?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      property_analytics: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_type: string
          id: string
          ip_address: string | null
          property_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          property_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          property_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_analytics_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_leads: {
        Row: {
          contacted: boolean | null
          contacted_at: string | null
          contacted_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          interest_level: string | null
          ip_address: string | null
          is_owner: boolean | null
          notes: string | null
          offer_viewed_at: string | null
          phone: string | null
          property_id: string | null
          selling_timeline: string | null
          status: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          contacted?: boolean | null
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          interest_level?: string | null
          ip_address?: string | null
          is_owner?: boolean | null
          notes?: string | null
          offer_viewed_at?: string | null
          phone?: string | null
          property_id?: string | null
          selling_timeline?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          contacted?: boolean | null
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          interest_level?: string | null
          ip_address?: string | null
          is_owner?: boolean | null
          notes?: string | null
          offer_viewed_at?: string | null
          phone?: string | null
          property_id?: string | null
          selling_timeline?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_notes: {
        Row: {
          created_at: string
          created_by: string | null
          follow_up_date: string | null
          id: string
          note_text: string
          property_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          follow_up_date?: string | null
          id?: string
          note_text: string
          property_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          follow_up_date?: string | null
          id?: string
          note_text?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_notes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_sequences: {
        Row: {
          created_at: string
          current_step: number
          id: string
          last_step_at: string | null
          next_step_due: string | null
          property_id: string
          responded_at: string | null
          sequence_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          id?: string
          last_step_at?: string | null
          next_step_due?: string | null
          property_id: string
          responded_at?: string | null
          sequence_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_step?: number
          id?: string
          last_step_at?: string | null
          next_step_due?: string | null
          property_id?: string
          responded_at?: string | null
          sequence_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_sequences_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_sequences_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "campaign_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_steps: {
        Row: {
          channel: string
          created_at: string
          delay_days: number
          id: string
          message_template: string | null
          sequence_id: string
          step_order: number
        }
        Insert: {
          channel: string
          created_at?: string
          delay_days?: number
          id?: string
          message_template?: string | null
          sequence_id: string
          step_order: number
        }
        Update: {
          channel?: string
          created_at?: string
          delay_days?: number
          id?: string
          message_template?: string | null
          sequence_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "campaign_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_settings: {
        Row: {
          api_endpoint: string
          api_key: string | null
          created_at: string | null
          headers: Json | null
          http_method: string
          id: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          api_key?: string | null
          created_at?: string | null
          headers?: Json | null
          http_method?: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          api_key?: string | null
          created_at?: string | null
          headers?: Json | null
          http_method?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_column_if_not_exists: {
        Args: {
          p_column_name: string
          p_column_type?: string
          p_table_name: string
        }
        Returns: boolean
      }
      column_exists: {
        Args: { p_column_name: string; p_table_name: string }
        Returns: boolean
      }
      get_table_columns: {
        Args: { p_table_name: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
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
    Enums: {},
  },
} as const
