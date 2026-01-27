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
      api_request_logs: {
        Row: {
          api_key_configured: boolean | null
          api_source: string
          city: string | null
          county: string | null
          created_at: string
          error_response: string | null
          execution_time_ms: number | null
          http_status: number | null
          http_status_text: string | null
          id: string
          metadata: Json | null
          normalized_address: string | null
          parsed_comps_count: number | null
          parsing_path_used: string | null
          request_address: string
          request_headers: Json | null
          request_url: string
          response_body: Json | null
          response_headers: Json | null
          response_structure_keys: string[] | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          api_key_configured?: boolean | null
          api_source?: string
          city?: string | null
          county?: string | null
          created_at?: string
          error_response?: string | null
          execution_time_ms?: number | null
          http_status?: number | null
          http_status_text?: string | null
          id?: string
          metadata?: Json | null
          normalized_address?: string | null
          parsed_comps_count?: number | null
          parsing_path_used?: string | null
          request_address: string
          request_headers?: Json | null
          request_url: string
          response_body?: Json | null
          response_headers?: Json | null
          response_structure_keys?: string[] | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          api_key_configured?: boolean | null
          api_source?: string
          city?: string | null
          county?: string | null
          created_at?: string
          error_response?: string | null
          execution_time_ms?: number | null
          http_status?: number | null
          http_status_text?: string | null
          id?: string
          metadata?: Json | null
          normalized_address?: string | null
          parsed_comps_count?: number | null
          parsing_path_used?: string | null
          request_address?: string
          request_headers?: Json | null
          request_url?: string
          response_body?: Json | null
          response_headers?: Json | null
          response_structure_keys?: string[] | null
          state?: string | null
          zip_code?: string | null
        }
        Relationships: []
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
          html_content: string | null
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
          status: string | null
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
          html_content?: string | null
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
          status?: string | null
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
          html_content?: string | null
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
          status?: string | null
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
      comparables_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          data: Json
          expires_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          data: Json
          expires_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          data?: Json
          expires_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comps_analysis_history: {
        Row: {
          analysis_data: Json
          analyst_user_id: string | null
          comparables_count: number | null
          created_at: string
          data_source: string | null
          expires_at: string | null
          id: string
          notes: string | null
          property_id: string
          search_radius_miles: number | null
          suggested_value_max: number | null
          suggested_value_min: number | null
        }
        Insert: {
          analysis_data?: Json
          analyst_user_id?: string | null
          comparables_count?: number | null
          created_at?: string
          data_source?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          property_id: string
          search_radius_miles?: number | null
          suggested_value_max?: number | null
          suggested_value_min?: number | null
        }
        Update: {
          analysis_data?: Json
          analyst_user_id?: string | null
          comparables_count?: number | null
          created_at?: string
          data_source?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          search_radius_miles?: number | null
          suggested_value_max?: number | null
          suggested_value_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comps_analysis_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      manual_comps_links: {
        Row: {
          comp_data: Json | null
          created_at: string
          id: string
          notes: string | null
          property_address: string
          property_id: string | null
          source: string
          updated_at: string
          url: string
          user_id: string | null
        }
        Insert: {
          comp_data?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          property_address: string
          property_id?: string | null
          source: string
          updated_at?: string
          url: string
          user_id?: string | null
        }
        Update: {
          comp_data?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          property_address?: string
          property_id?: string | null
          source?: string
          updated_at?: string
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_comps_links_property_id_fkey"
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
          age: number | null
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
          confirmed_mailing_address: string | null
          confirmed_mailing_city: string | null
          confirmed_mailing_state: string | null
          confirmed_mailing_zip: string | null
          county: string | null
          created_at: string
          deceased: boolean | null
          dnc_flag: boolean | null
          dnc_litigator_scrub: string | null
          email_sent: boolean
          email1: string | null
          email2: string | null
          estimated_value: number
          evaluation: string | null
          focar: string | null
          id: string
          import_batch: string | null
          import_date: string | null
          input_custom_field_1: string | null
          input_custom_field_2: string | null
          input_custom_field_3: string | null
          input_first_name: string | null
          input_last_name: string | null
          input_mailing_address: string | null
          input_mailing_city: string | null
          input_mailing_state: string | null
          input_mailing_zip: string | null
          input_property_address: string | null
          input_property_city: string | null
          input_property_state: string | null
          input_property_zip: string | null
          last_contact_date: string | null
          latitude: number | null
          lead_captured: boolean | null
          lead_captured_at: string | null
          lead_score: number | null
          lead_status: string
          letter_sent: boolean
          longitude: number | null
          lot_size: number | null
          matched_first_name: string | null
          matched_last_name: string | null
          meeting_scheduled: boolean
          neighborhood: string | null
          next_followup_date: string | null
          origem: string | null
          owner_address: string | null
          owner_fix_first_name: string | null
          owner_fix_last_name: string | null
          owner_fix_mailing_address: string | null
          owner_fix_mailing_city: string | null
          owner_fix_mailing_state: string | null
          owner_fix_mailing_zip: string | null
          owner_name: string | null
          owner_phone: string | null
          person2_age: number | null
          person2_confirmed_mailing_address: string | null
          person2_confirmed_mailing_city: string | null
          person2_confirmed_mailing_state: string | null
          person2_confirmed_mailing_zip: string | null
          person2_deceased: boolean | null
          person2_email1: string | null
          person2_email2: string | null
          person2_first_name: string | null
          person2_last_name: string | null
          person2_phone1: string | null
          person2_phone1_type: string | null
          person2_phone2: string | null
          person2_phone2_type: string | null
          person2_phone3: string | null
          person2_phone3_type: string | null
          person2_phone4: string | null
          person2_phone4_type: string | null
          person2_phone5: string | null
          person2_phone5_type: string | null
          person2_phone6: string | null
          person2_phone6_type: string | null
          person2_phone7: string | null
          person2_phone7_type: string | null
          person2_relative1_age: number | null
          person2_relative1_name: string | null
          person2_relative1_phone1: string | null
          person2_relative1_phone1_type: string | null
          person2_relative1_phone2: string | null
          person2_relative1_phone2_type: string | null
          person2_relative1_phone3: string | null
          person2_relative1_phone3_type: string | null
          person2_relative1_phone4: string | null
          person2_relative1_phone4_type: string | null
          person2_relative1_phone5: string | null
          person2_relative1_phone5_type: string | null
          person2_relative2_age: number | null
          person2_relative2_name: string | null
          person2_relative2_phone1: string | null
          person2_relative2_phone1_type: string | null
          person2_relative2_phone2: string | null
          person2_relative2_phone2_type: string | null
          person2_relative2_phone3: string | null
          person2_relative2_phone3_type: string | null
          person2_relative2_phone4: string | null
          person2_relative2_phone4_type: string | null
          person2_relative2_phone5: string | null
          person2_relative2_phone5_type: string | null
          person2_relative3_age: number | null
          person2_relative3_name: string | null
          person2_relative3_phone1: string | null
          person2_relative3_phone1_type: string | null
          person2_relative3_phone2: string | null
          person2_relative3_phone2_type: string | null
          person2_relative3_phone3: string | null
          person2_relative3_phone3_type: string | null
          person2_relative3_phone4: string | null
          person2_relative3_phone4_type: string | null
          person2_relative3_phone5: string | null
          person2_relative3_phone5_type: string | null
          person2_relative4_age: number | null
          person2_relative4_name: string | null
          person2_relative4_phone1: string | null
          person2_relative4_phone1_type: string | null
          person2_relative4_phone2: string | null
          person2_relative4_phone2_type: string | null
          person2_relative4_phone3: string | null
          person2_relative4_phone3_type: string | null
          person2_relative4_phone4: string | null
          person2_relative4_phone4_type: string | null
          person2_relative4_phone5: string | null
          person2_relative4_phone5_type: string | null
          person2_relative5_age: number | null
          person2_relative5_name: string | null
          person2_relative5_phone1: string | null
          person2_relative5_phone1_type: string | null
          person2_relative5_phone2: string | null
          person2_relative5_phone2_type: string | null
          person2_relative5_phone3: string | null
          person2_relative5_phone3_type: string | null
          person2_relative5_phone4: string | null
          person2_relative5_phone4_type: string | null
          person2_relative5_phone5: string | null
          person2_relative5_phone5_type: string | null
          person3_age: number | null
          person3_confirmed_mailing_address: string | null
          person3_confirmed_mailing_city: string | null
          person3_confirmed_mailing_state: string | null
          person3_confirmed_mailing_zip: string | null
          person3_deceased: boolean | null
          person3_email1: string | null
          person3_email2: string | null
          person3_first_name: string | null
          person3_last_name: string | null
          person3_phone1: string | null
          person3_phone1_type: string | null
          person3_phone2: string | null
          person3_phone2_type: string | null
          person3_phone3: string | null
          person3_phone3_type: string | null
          person3_phone4: string | null
          person3_phone4_type: string | null
          person3_phone5: string | null
          person3_phone5_type: string | null
          person3_phone6: string | null
          person3_phone6_type: string | null
          person3_phone7: string | null
          person3_phone7_type: string | null
          person3_relative1_age: number | null
          person3_relative1_name: string | null
          person3_relative1_phone1: string | null
          person3_relative1_phone1_type: string | null
          person3_relative1_phone2: string | null
          person3_relative1_phone2_type: string | null
          person3_relative1_phone3: string | null
          person3_relative1_phone3_type: string | null
          person3_relative1_phone4: string | null
          person3_relative1_phone4_type: string | null
          person3_relative1_phone5: string | null
          person3_relative1_phone5_type: string | null
          person3_relative2_age: number | null
          person3_relative2_name: string | null
          person3_relative2_phone1: string | null
          person3_relative2_phone1_type: string | null
          person3_relative2_phone2: string | null
          person3_relative2_phone2_type: string | null
          person3_relative2_phone3: string | null
          person3_relative2_phone3_type: string | null
          person3_relative2_phone4: string | null
          person3_relative2_phone4_type: string | null
          person3_relative2_phone5: string | null
          person3_relative2_phone5_type: string | null
          person3_relative3_age: number | null
          person3_relative3_name: string | null
          person3_relative3_phone1: string | null
          person3_relative3_phone1_type: string | null
          person3_relative3_phone2: string | null
          person3_relative3_phone2_type: string | null
          person3_relative3_phone3: string | null
          person3_relative3_phone3_type: string | null
          person3_relative3_phone4: string | null
          person3_relative3_phone4_type: string | null
          person3_relative3_phone5: string | null
          person3_relative3_phone5_type: string | null
          person3_relative4_age: number | null
          person3_relative4_name: string | null
          person3_relative4_phone1: string | null
          person3_relative4_phone1_type: string | null
          person3_relative4_phone2: string | null
          person3_relative4_phone2_type: string | null
          person3_relative4_phone3: string | null
          person3_relative4_phone3_type: string | null
          person3_relative4_phone4: string | null
          person3_relative4_phone4_type: string | null
          person3_relative4_phone5: string | null
          person3_relative4_phone5_type: string | null
          person3_relative5_age: number | null
          person3_relative5_name: string | null
          person3_relative5_phone1: string | null
          person3_relative5_phone1_type: string | null
          person3_relative5_phone2: string | null
          person3_relative5_phone2_type: string | null
          person3_relative5_phone3: string | null
          person3_relative5_phone3_type: string | null
          person3_relative5_phone4: string | null
          person3_relative5_phone4_type: string | null
          person3_relative5_phone5: string | null
          person3_relative5_phone5_type: string | null
          phone_call_made: boolean
          phone1: string | null
          phone1_type: string | null
          phone2: string | null
          phone2_type: string | null
          phone3: string | null
          phone3_type: string | null
          phone4: string | null
          phone4_type: string | null
          phone5: string | null
          phone5_type: string | null
          phone6: string | null
          phone6_type: string | null
          phone7: string | null
          phone7_type: string | null
          property_image_url: string | null
          property_type: string | null
          rejection_notes: string | null
          rejection_reason: string | null
          relative1_age: number | null
          relative1_name: string | null
          relative1_phone1: string | null
          relative1_phone1_type: string | null
          relative1_phone2: string | null
          relative1_phone2_type: string | null
          relative1_phone3: string | null
          relative1_phone3_type: string | null
          relative1_phone4: string | null
          relative1_phone4_type: string | null
          relative1_phone5: string | null
          relative1_phone5_type: string | null
          relative2_age: number | null
          relative2_name: string | null
          relative2_phone1: string | null
          relative2_phone1_type: string | null
          relative2_phone2: string | null
          relative2_phone2_type: string | null
          relative2_phone3: string | null
          relative2_phone3_type: string | null
          relative2_phone4: string | null
          relative2_phone4_type: string | null
          relative2_phone5: string | null
          relative2_phone5_type: string | null
          relative3_age: number | null
          relative3_name: string | null
          relative3_phone1: string | null
          relative3_phone1_type: string | null
          relative3_phone2: string | null
          relative3_phone2_type: string | null
          relative3_phone3: string | null
          relative3_phone3_type: string | null
          relative3_phone4: string | null
          relative3_phone4_type: string | null
          relative3_phone5: string | null
          relative3_phone5_type: string | null
          relative4_age: number | null
          relative4_name: string | null
          relative4_phone1: string | null
          relative4_phone1_type: string | null
          relative4_phone2: string | null
          relative4_phone2_type: string | null
          relative4_phone3: string | null
          relative4_phone3_type: string | null
          relative4_phone4: string | null
          relative4_phone4_type: string | null
          relative4_phone5: string | null
          relative4_phone5_type: string | null
          relative5_age: number | null
          relative5_name: string | null
          relative5_phone1: string | null
          relative5_phone1_type: string | null
          relative5_phone2: string | null
          relative5_phone2_type: string | null
          relative5_phone3: string | null
          relative5_phone3_type: string | null
          relative5_phone4: string | null
          relative5_phone4_type: string | null
          relative5_phone5: string | null
          relative5_phone5_type: string | null
          resultcode: string | null
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
          age?: number | null
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
          confirmed_mailing_address?: string | null
          confirmed_mailing_city?: string | null
          confirmed_mailing_state?: string | null
          confirmed_mailing_zip?: string | null
          county?: string | null
          created_at?: string
          deceased?: boolean | null
          dnc_flag?: boolean | null
          dnc_litigator_scrub?: string | null
          email_sent?: boolean
          email1?: string | null
          email2?: string | null
          estimated_value: number
          evaluation?: string | null
          focar?: string | null
          id?: string
          import_batch?: string | null
          import_date?: string | null
          input_custom_field_1?: string | null
          input_custom_field_2?: string | null
          input_custom_field_3?: string | null
          input_first_name?: string | null
          input_last_name?: string | null
          input_mailing_address?: string | null
          input_mailing_city?: string | null
          input_mailing_state?: string | null
          input_mailing_zip?: string | null
          input_property_address?: string | null
          input_property_city?: string | null
          input_property_state?: string | null
          input_property_zip?: string | null
          last_contact_date?: string | null
          latitude?: number | null
          lead_captured?: boolean | null
          lead_captured_at?: string | null
          lead_score?: number | null
          lead_status?: string
          letter_sent?: boolean
          longitude?: number | null
          lot_size?: number | null
          matched_first_name?: string | null
          matched_last_name?: string | null
          meeting_scheduled?: boolean
          neighborhood?: string | null
          next_followup_date?: string | null
          origem?: string | null
          owner_address?: string | null
          owner_fix_first_name?: string | null
          owner_fix_last_name?: string | null
          owner_fix_mailing_address?: string | null
          owner_fix_mailing_city?: string | null
          owner_fix_mailing_state?: string | null
          owner_fix_mailing_zip?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          person2_age?: number | null
          person2_confirmed_mailing_address?: string | null
          person2_confirmed_mailing_city?: string | null
          person2_confirmed_mailing_state?: string | null
          person2_confirmed_mailing_zip?: string | null
          person2_deceased?: boolean | null
          person2_email1?: string | null
          person2_email2?: string | null
          person2_first_name?: string | null
          person2_last_name?: string | null
          person2_phone1?: string | null
          person2_phone1_type?: string | null
          person2_phone2?: string | null
          person2_phone2_type?: string | null
          person2_phone3?: string | null
          person2_phone3_type?: string | null
          person2_phone4?: string | null
          person2_phone4_type?: string | null
          person2_phone5?: string | null
          person2_phone5_type?: string | null
          person2_phone6?: string | null
          person2_phone6_type?: string | null
          person2_phone7?: string | null
          person2_phone7_type?: string | null
          person2_relative1_age?: number | null
          person2_relative1_name?: string | null
          person2_relative1_phone1?: string | null
          person2_relative1_phone1_type?: string | null
          person2_relative1_phone2?: string | null
          person2_relative1_phone2_type?: string | null
          person2_relative1_phone3?: string | null
          person2_relative1_phone3_type?: string | null
          person2_relative1_phone4?: string | null
          person2_relative1_phone4_type?: string | null
          person2_relative1_phone5?: string | null
          person2_relative1_phone5_type?: string | null
          person2_relative2_age?: number | null
          person2_relative2_name?: string | null
          person2_relative2_phone1?: string | null
          person2_relative2_phone1_type?: string | null
          person2_relative2_phone2?: string | null
          person2_relative2_phone2_type?: string | null
          person2_relative2_phone3?: string | null
          person2_relative2_phone3_type?: string | null
          person2_relative2_phone4?: string | null
          person2_relative2_phone4_type?: string | null
          person2_relative2_phone5?: string | null
          person2_relative2_phone5_type?: string | null
          person2_relative3_age?: number | null
          person2_relative3_name?: string | null
          person2_relative3_phone1?: string | null
          person2_relative3_phone1_type?: string | null
          person2_relative3_phone2?: string | null
          person2_relative3_phone2_type?: string | null
          person2_relative3_phone3?: string | null
          person2_relative3_phone3_type?: string | null
          person2_relative3_phone4?: string | null
          person2_relative3_phone4_type?: string | null
          person2_relative3_phone5?: string | null
          person2_relative3_phone5_type?: string | null
          person2_relative4_age?: number | null
          person2_relative4_name?: string | null
          person2_relative4_phone1?: string | null
          person2_relative4_phone1_type?: string | null
          person2_relative4_phone2?: string | null
          person2_relative4_phone2_type?: string | null
          person2_relative4_phone3?: string | null
          person2_relative4_phone3_type?: string | null
          person2_relative4_phone4?: string | null
          person2_relative4_phone4_type?: string | null
          person2_relative4_phone5?: string | null
          person2_relative4_phone5_type?: string | null
          person2_relative5_age?: number | null
          person2_relative5_name?: string | null
          person2_relative5_phone1?: string | null
          person2_relative5_phone1_type?: string | null
          person2_relative5_phone2?: string | null
          person2_relative5_phone2_type?: string | null
          person2_relative5_phone3?: string | null
          person2_relative5_phone3_type?: string | null
          person2_relative5_phone4?: string | null
          person2_relative5_phone4_type?: string | null
          person2_relative5_phone5?: string | null
          person2_relative5_phone5_type?: string | null
          person3_age?: number | null
          person3_confirmed_mailing_address?: string | null
          person3_confirmed_mailing_city?: string | null
          person3_confirmed_mailing_state?: string | null
          person3_confirmed_mailing_zip?: string | null
          person3_deceased?: boolean | null
          person3_email1?: string | null
          person3_email2?: string | null
          person3_first_name?: string | null
          person3_last_name?: string | null
          person3_phone1?: string | null
          person3_phone1_type?: string | null
          person3_phone2?: string | null
          person3_phone2_type?: string | null
          person3_phone3?: string | null
          person3_phone3_type?: string | null
          person3_phone4?: string | null
          person3_phone4_type?: string | null
          person3_phone5?: string | null
          person3_phone5_type?: string | null
          person3_phone6?: string | null
          person3_phone6_type?: string | null
          person3_phone7?: string | null
          person3_phone7_type?: string | null
          person3_relative1_age?: number | null
          person3_relative1_name?: string | null
          person3_relative1_phone1?: string | null
          person3_relative1_phone1_type?: string | null
          person3_relative1_phone2?: string | null
          person3_relative1_phone2_type?: string | null
          person3_relative1_phone3?: string | null
          person3_relative1_phone3_type?: string | null
          person3_relative1_phone4?: string | null
          person3_relative1_phone4_type?: string | null
          person3_relative1_phone5?: string | null
          person3_relative1_phone5_type?: string | null
          person3_relative2_age?: number | null
          person3_relative2_name?: string | null
          person3_relative2_phone1?: string | null
          person3_relative2_phone1_type?: string | null
          person3_relative2_phone2?: string | null
          person3_relative2_phone2_type?: string | null
          person3_relative2_phone3?: string | null
          person3_relative2_phone3_type?: string | null
          person3_relative2_phone4?: string | null
          person3_relative2_phone4_type?: string | null
          person3_relative2_phone5?: string | null
          person3_relative2_phone5_type?: string | null
          person3_relative3_age?: number | null
          person3_relative3_name?: string | null
          person3_relative3_phone1?: string | null
          person3_relative3_phone1_type?: string | null
          person3_relative3_phone2?: string | null
          person3_relative3_phone2_type?: string | null
          person3_relative3_phone3?: string | null
          person3_relative3_phone3_type?: string | null
          person3_relative3_phone4?: string | null
          person3_relative3_phone4_type?: string | null
          person3_relative3_phone5?: string | null
          person3_relative3_phone5_type?: string | null
          person3_relative4_age?: number | null
          person3_relative4_name?: string | null
          person3_relative4_phone1?: string | null
          person3_relative4_phone1_type?: string | null
          person3_relative4_phone2?: string | null
          person3_relative4_phone2_type?: string | null
          person3_relative4_phone3?: string | null
          person3_relative4_phone3_type?: string | null
          person3_relative4_phone4?: string | null
          person3_relative4_phone4_type?: string | null
          person3_relative4_phone5?: string | null
          person3_relative4_phone5_type?: string | null
          person3_relative5_age?: number | null
          person3_relative5_name?: string | null
          person3_relative5_phone1?: string | null
          person3_relative5_phone1_type?: string | null
          person3_relative5_phone2?: string | null
          person3_relative5_phone2_type?: string | null
          person3_relative5_phone3?: string | null
          person3_relative5_phone3_type?: string | null
          person3_relative5_phone4?: string | null
          person3_relative5_phone4_type?: string | null
          person3_relative5_phone5?: string | null
          person3_relative5_phone5_type?: string | null
          phone_call_made?: boolean
          phone1?: string | null
          phone1_type?: string | null
          phone2?: string | null
          phone2_type?: string | null
          phone3?: string | null
          phone3_type?: string | null
          phone4?: string | null
          phone4_type?: string | null
          phone5?: string | null
          phone5_type?: string | null
          phone6?: string | null
          phone6_type?: string | null
          phone7?: string | null
          phone7_type?: string | null
          property_image_url?: string | null
          property_type?: string | null
          rejection_notes?: string | null
          rejection_reason?: string | null
          relative1_age?: number | null
          relative1_name?: string | null
          relative1_phone1?: string | null
          relative1_phone1_type?: string | null
          relative1_phone2?: string | null
          relative1_phone2_type?: string | null
          relative1_phone3?: string | null
          relative1_phone3_type?: string | null
          relative1_phone4?: string | null
          relative1_phone4_type?: string | null
          relative1_phone5?: string | null
          relative1_phone5_type?: string | null
          relative2_age?: number | null
          relative2_name?: string | null
          relative2_phone1?: string | null
          relative2_phone1_type?: string | null
          relative2_phone2?: string | null
          relative2_phone2_type?: string | null
          relative2_phone3?: string | null
          relative2_phone3_type?: string | null
          relative2_phone4?: string | null
          relative2_phone4_type?: string | null
          relative2_phone5?: string | null
          relative2_phone5_type?: string | null
          relative3_age?: number | null
          relative3_name?: string | null
          relative3_phone1?: string | null
          relative3_phone1_type?: string | null
          relative3_phone2?: string | null
          relative3_phone2_type?: string | null
          relative3_phone3?: string | null
          relative3_phone3_type?: string | null
          relative3_phone4?: string | null
          relative3_phone4_type?: string | null
          relative3_phone5?: string | null
          relative3_phone5_type?: string | null
          relative4_age?: number | null
          relative4_name?: string | null
          relative4_phone1?: string | null
          relative4_phone1_type?: string | null
          relative4_phone2?: string | null
          relative4_phone2_type?: string | null
          relative4_phone3?: string | null
          relative4_phone3_type?: string | null
          relative4_phone4?: string | null
          relative4_phone4_type?: string | null
          relative4_phone5?: string | null
          relative4_phone5_type?: string | null
          relative5_age?: number | null
          relative5_name?: string | null
          relative5_phone1?: string | null
          relative5_phone1_type?: string | null
          relative5_phone2?: string | null
          relative5_phone2_type?: string | null
          relative5_phone3?: string | null
          relative5_phone3_type?: string | null
          relative5_phone4?: string | null
          relative5_phone4_type?: string | null
          relative5_phone5?: string | null
          relative5_phone5_type?: string | null
          resultcode?: string | null
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
          age?: number | null
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
          confirmed_mailing_address?: string | null
          confirmed_mailing_city?: string | null
          confirmed_mailing_state?: string | null
          confirmed_mailing_zip?: string | null
          county?: string | null
          created_at?: string
          deceased?: boolean | null
          dnc_flag?: boolean | null
          dnc_litigator_scrub?: string | null
          email_sent?: boolean
          email1?: string | null
          email2?: string | null
          estimated_value?: number
          evaluation?: string | null
          focar?: string | null
          id?: string
          import_batch?: string | null
          import_date?: string | null
          input_custom_field_1?: string | null
          input_custom_field_2?: string | null
          input_custom_field_3?: string | null
          input_first_name?: string | null
          input_last_name?: string | null
          input_mailing_address?: string | null
          input_mailing_city?: string | null
          input_mailing_state?: string | null
          input_mailing_zip?: string | null
          input_property_address?: string | null
          input_property_city?: string | null
          input_property_state?: string | null
          input_property_zip?: string | null
          last_contact_date?: string | null
          latitude?: number | null
          lead_captured?: boolean | null
          lead_captured_at?: string | null
          lead_score?: number | null
          lead_status?: string
          letter_sent?: boolean
          longitude?: number | null
          lot_size?: number | null
          matched_first_name?: string | null
          matched_last_name?: string | null
          meeting_scheduled?: boolean
          neighborhood?: string | null
          next_followup_date?: string | null
          origem?: string | null
          owner_address?: string | null
          owner_fix_first_name?: string | null
          owner_fix_last_name?: string | null
          owner_fix_mailing_address?: string | null
          owner_fix_mailing_city?: string | null
          owner_fix_mailing_state?: string | null
          owner_fix_mailing_zip?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          person2_age?: number | null
          person2_confirmed_mailing_address?: string | null
          person2_confirmed_mailing_city?: string | null
          person2_confirmed_mailing_state?: string | null
          person2_confirmed_mailing_zip?: string | null
          person2_deceased?: boolean | null
          person2_email1?: string | null
          person2_email2?: string | null
          person2_first_name?: string | null
          person2_last_name?: string | null
          person2_phone1?: string | null
          person2_phone1_type?: string | null
          person2_phone2?: string | null
          person2_phone2_type?: string | null
          person2_phone3?: string | null
          person2_phone3_type?: string | null
          person2_phone4?: string | null
          person2_phone4_type?: string | null
          person2_phone5?: string | null
          person2_phone5_type?: string | null
          person2_phone6?: string | null
          person2_phone6_type?: string | null
          person2_phone7?: string | null
          person2_phone7_type?: string | null
          person2_relative1_age?: number | null
          person2_relative1_name?: string | null
          person2_relative1_phone1?: string | null
          person2_relative1_phone1_type?: string | null
          person2_relative1_phone2?: string | null
          person2_relative1_phone2_type?: string | null
          person2_relative1_phone3?: string | null
          person2_relative1_phone3_type?: string | null
          person2_relative1_phone4?: string | null
          person2_relative1_phone4_type?: string | null
          person2_relative1_phone5?: string | null
          person2_relative1_phone5_type?: string | null
          person2_relative2_age?: number | null
          person2_relative2_name?: string | null
          person2_relative2_phone1?: string | null
          person2_relative2_phone1_type?: string | null
          person2_relative2_phone2?: string | null
          person2_relative2_phone2_type?: string | null
          person2_relative2_phone3?: string | null
          person2_relative2_phone3_type?: string | null
          person2_relative2_phone4?: string | null
          person2_relative2_phone4_type?: string | null
          person2_relative2_phone5?: string | null
          person2_relative2_phone5_type?: string | null
          person2_relative3_age?: number | null
          person2_relative3_name?: string | null
          person2_relative3_phone1?: string | null
          person2_relative3_phone1_type?: string | null
          person2_relative3_phone2?: string | null
          person2_relative3_phone2_type?: string | null
          person2_relative3_phone3?: string | null
          person2_relative3_phone3_type?: string | null
          person2_relative3_phone4?: string | null
          person2_relative3_phone4_type?: string | null
          person2_relative3_phone5?: string | null
          person2_relative3_phone5_type?: string | null
          person2_relative4_age?: number | null
          person2_relative4_name?: string | null
          person2_relative4_phone1?: string | null
          person2_relative4_phone1_type?: string | null
          person2_relative4_phone2?: string | null
          person2_relative4_phone2_type?: string | null
          person2_relative4_phone3?: string | null
          person2_relative4_phone3_type?: string | null
          person2_relative4_phone4?: string | null
          person2_relative4_phone4_type?: string | null
          person2_relative4_phone5?: string | null
          person2_relative4_phone5_type?: string | null
          person2_relative5_age?: number | null
          person2_relative5_name?: string | null
          person2_relative5_phone1?: string | null
          person2_relative5_phone1_type?: string | null
          person2_relative5_phone2?: string | null
          person2_relative5_phone2_type?: string | null
          person2_relative5_phone3?: string | null
          person2_relative5_phone3_type?: string | null
          person2_relative5_phone4?: string | null
          person2_relative5_phone4_type?: string | null
          person2_relative5_phone5?: string | null
          person2_relative5_phone5_type?: string | null
          person3_age?: number | null
          person3_confirmed_mailing_address?: string | null
          person3_confirmed_mailing_city?: string | null
          person3_confirmed_mailing_state?: string | null
          person3_confirmed_mailing_zip?: string | null
          person3_deceased?: boolean | null
          person3_email1?: string | null
          person3_email2?: string | null
          person3_first_name?: string | null
          person3_last_name?: string | null
          person3_phone1?: string | null
          person3_phone1_type?: string | null
          person3_phone2?: string | null
          person3_phone2_type?: string | null
          person3_phone3?: string | null
          person3_phone3_type?: string | null
          person3_phone4?: string | null
          person3_phone4_type?: string | null
          person3_phone5?: string | null
          person3_phone5_type?: string | null
          person3_phone6?: string | null
          person3_phone6_type?: string | null
          person3_phone7?: string | null
          person3_phone7_type?: string | null
          person3_relative1_age?: number | null
          person3_relative1_name?: string | null
          person3_relative1_phone1?: string | null
          person3_relative1_phone1_type?: string | null
          person3_relative1_phone2?: string | null
          person3_relative1_phone2_type?: string | null
          person3_relative1_phone3?: string | null
          person3_relative1_phone3_type?: string | null
          person3_relative1_phone4?: string | null
          person3_relative1_phone4_type?: string | null
          person3_relative1_phone5?: string | null
          person3_relative1_phone5_type?: string | null
          person3_relative2_age?: number | null
          person3_relative2_name?: string | null
          person3_relative2_phone1?: string | null
          person3_relative2_phone1_type?: string | null
          person3_relative2_phone2?: string | null
          person3_relative2_phone2_type?: string | null
          person3_relative2_phone3?: string | null
          person3_relative2_phone3_type?: string | null
          person3_relative2_phone4?: string | null
          person3_relative2_phone4_type?: string | null
          person3_relative2_phone5?: string | null
          person3_relative2_phone5_type?: string | null
          person3_relative3_age?: number | null
          person3_relative3_name?: string | null
          person3_relative3_phone1?: string | null
          person3_relative3_phone1_type?: string | null
          person3_relative3_phone2?: string | null
          person3_relative3_phone2_type?: string | null
          person3_relative3_phone3?: string | null
          person3_relative3_phone3_type?: string | null
          person3_relative3_phone4?: string | null
          person3_relative3_phone4_type?: string | null
          person3_relative3_phone5?: string | null
          person3_relative3_phone5_type?: string | null
          person3_relative4_age?: number | null
          person3_relative4_name?: string | null
          person3_relative4_phone1?: string | null
          person3_relative4_phone1_type?: string | null
          person3_relative4_phone2?: string | null
          person3_relative4_phone2_type?: string | null
          person3_relative4_phone3?: string | null
          person3_relative4_phone3_type?: string | null
          person3_relative4_phone4?: string | null
          person3_relative4_phone4_type?: string | null
          person3_relative4_phone5?: string | null
          person3_relative4_phone5_type?: string | null
          person3_relative5_age?: number | null
          person3_relative5_name?: string | null
          person3_relative5_phone1?: string | null
          person3_relative5_phone1_type?: string | null
          person3_relative5_phone2?: string | null
          person3_relative5_phone2_type?: string | null
          person3_relative5_phone3?: string | null
          person3_relative5_phone3_type?: string | null
          person3_relative5_phone4?: string | null
          person3_relative5_phone4_type?: string | null
          person3_relative5_phone5?: string | null
          person3_relative5_phone5_type?: string | null
          phone_call_made?: boolean
          phone1?: string | null
          phone1_type?: string | null
          phone2?: string | null
          phone2_type?: string | null
          phone3?: string | null
          phone3_type?: string | null
          phone4?: string | null
          phone4_type?: string | null
          phone5?: string | null
          phone5_type?: string | null
          phone6?: string | null
          phone6_type?: string | null
          phone7?: string | null
          phone7_type?: string | null
          property_image_url?: string | null
          property_type?: string | null
          rejection_notes?: string | null
          rejection_reason?: string | null
          relative1_age?: number | null
          relative1_name?: string | null
          relative1_phone1?: string | null
          relative1_phone1_type?: string | null
          relative1_phone2?: string | null
          relative1_phone2_type?: string | null
          relative1_phone3?: string | null
          relative1_phone3_type?: string | null
          relative1_phone4?: string | null
          relative1_phone4_type?: string | null
          relative1_phone5?: string | null
          relative1_phone5_type?: string | null
          relative2_age?: number | null
          relative2_name?: string | null
          relative2_phone1?: string | null
          relative2_phone1_type?: string | null
          relative2_phone2?: string | null
          relative2_phone2_type?: string | null
          relative2_phone3?: string | null
          relative2_phone3_type?: string | null
          relative2_phone4?: string | null
          relative2_phone4_type?: string | null
          relative2_phone5?: string | null
          relative2_phone5_type?: string | null
          relative3_age?: number | null
          relative3_name?: string | null
          relative3_phone1?: string | null
          relative3_phone1_type?: string | null
          relative3_phone2?: string | null
          relative3_phone2_type?: string | null
          relative3_phone3?: string | null
          relative3_phone3_type?: string | null
          relative3_phone4?: string | null
          relative3_phone4_type?: string | null
          relative3_phone5?: string | null
          relative3_phone5_type?: string | null
          relative4_age?: number | null
          relative4_name?: string | null
          relative4_phone1?: string | null
          relative4_phone1_type?: string | null
          relative4_phone2?: string | null
          relative4_phone2_type?: string | null
          relative4_phone3?: string | null
          relative4_phone3_type?: string | null
          relative4_phone4?: string | null
          relative4_phone4_type?: string | null
          relative4_phone5?: string | null
          relative4_phone5_type?: string | null
          relative5_age?: number | null
          relative5_name?: string | null
          relative5_phone1?: string | null
          relative5_phone1_type?: string | null
          relative5_phone2?: string | null
          relative5_phone2_type?: string | null
          relative5_phone3?: string | null
          relative5_phone3_type?: string | null
          relative5_phone4?: string | null
          relative5_phone4_type?: string | null
          relative5_phone5?: string | null
          relative5_phone5_type?: string | null
          resultcode?: string | null
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
          source: string | null
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
          source?: string | null
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
          source?: string | null
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
      property_offer_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          id: string
          new_amount: number
          notes: string | null
          previous_amount: number | null
          property_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_amount: number
          notes?: string | null
          previous_amount?: number | null
          property_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_amount?: number
          notes?: string | null
          previous_amount?: number | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_offer_history_property_id_fkey"
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
      templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          edited_manually: boolean | null
          id: string
          is_default: boolean | null
          name: string
          subject: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          edited_manually?: boolean | null
          id: string
          is_default?: boolean | null
          name: string
          subject?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          edited_manually?: boolean | null
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: string | null
          updated_at?: string
          version?: number | null
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
      cleanup_expired_cache: {
        Args: never
        Returns: {
          deleted_comparables_cache: number
          deleted_comps_history: number
        }[]
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
