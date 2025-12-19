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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      antivirus: {
        Row: {
          av_product_name: string | null
          av_status: string | null
          created_at: string | null
          device_name: string | null
          id: number
          last_scan: string | null
          last_update: string | null
          threat_count: number | null
        }
        Insert: {
          av_product_name?: string | null
          av_status?: string | null
          created_at?: string | null
          device_name?: string | null
          id?: number
          last_scan?: string | null
          last_update?: string | null
          threat_count?: number | null
        }
        Update: {
          av_product_name?: string | null
          av_status?: string | null
          created_at?: string | null
          device_name?: string | null
          id?: number
          last_scan?: string | null
          last_update?: string | null
          threat_count?: number | null
        }
        Relationships: []
      }
      backups_overview: {
        Row: {
          active_data_sources: string | null
          backup_server_status: string | null
          color_bar_last_28_days: string | null
          computer_name: string | null
          created_at: string | null
          device_id: string | null
          device_name: string | null
          device_type: string | null
          id: number
          last_successful_session: string | null
          localspeedvault_status: string | null
          m365_billable_users: number | null
          number_of_errors: number | null
          partner_name: string | null
          product_name: string | null
          profile: string | null
          profile_id: string | null
          total_selected_size_gb: number | null
          total_status: string | null
          used_storage_gb: number | null
          vdr_color_bar_last_28_days: string | null
        }
        Insert: {
          active_data_sources?: string | null
          backup_server_status?: string | null
          color_bar_last_28_days?: string | null
          computer_name?: string | null
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: number
          last_successful_session?: string | null
          localspeedvault_status?: string | null
          m365_billable_users?: number | null
          number_of_errors?: number | null
          partner_name?: string | null
          product_name?: string | null
          profile?: string | null
          profile_id?: string | null
          total_selected_size_gb?: number | null
          total_status?: string | null
          used_storage_gb?: number | null
          vdr_color_bar_last_28_days?: string | null
        }
        Update: {
          active_data_sources?: string | null
          backup_server_status?: string | null
          color_bar_last_28_days?: string | null
          computer_name?: string | null
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: number
          last_successful_session?: string | null
          localspeedvault_status?: string | null
          m365_billable_users?: number | null
          number_of_errors?: number | null
          partner_name?: string | null
          product_name?: string | null
          profile?: string | null
          profile_id?: string | null
          total_selected_size_gb?: number | null
          total_status?: string | null
          used_storage_gb?: number | null
          vdr_color_bar_last_28_days?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      customers_normalized: {
        Row: {
          created_at: string | null
          id: number
          key: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          key: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: never
          key?: string
          name?: string
        }
        Relationships: []
      }
      devices_normalized: {
        Row: {
          connection_status: string | null
          customer_key: string
          device_id: string
          id: number
          last_seen: string | null
          name: string
          site_id: number | null
          type: string | null
        }
        Insert: {
          connection_status?: string | null
          customer_key: string
          device_id: string
          id?: never
          last_seen?: string | null
          name: string
          site_id?: number | null
          type?: string | null
        }
        Update: {
          connection_status?: string | null
          customer_key?: string
          device_id?: string
          id?: never
          last_seen?: string | null
          name?: string
          site_id?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_normalized_customer_key_fkey"
            columns: ["customer_key"]
            isOneToOne: false
            referencedRelation: "customers_normalized"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "devices_normalized_customer_key_fkey"
            columns: ["customer_key"]
            isOneToOne: false
            referencedRelation: "v_customer_overview"
            referencedColumns: ["customer_key"]
          },
          {
            foreignKeyName: "devices_normalized_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      patch_overview: {
        Row: {
          client: string | null
          created_at: string | null
          device: string | null
          discovered_install_date: string | null
          id: number
          patch: string | null
          site: string | null
          status: string | null
        }
        Insert: {
          client?: string | null
          created_at?: string | null
          device?: string | null
          discovered_install_date?: string | null
          id?: number
          patch?: string | null
          site?: string | null
          status?: string | null
        }
        Update: {
          client?: string | null
          created_at?: string | null
          device?: string | null
          discovered_install_date?: string | null
          id?: number
          patch?: string | null
          site?: string | null
          status?: string | null
        }
        Relationships: []
      }
      rmm_backups: {
        Row: {
          created_at: string | null
          device_id: string
          id: number
          last_backup: string | null
          size_bytes: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: never
          last_backup?: string | null
          size_bytes?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: never
          last_backup?: string | null
          size_bytes?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rmm_backups_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices_normalized"
            referencedColumns: ["device_id"]
          },
        ]
      }
      rmm_patches: {
        Row: {
          created_at: string | null
          device_id: string
          id: number
          installed_at: string | null
          kb: string | null
          patch_name: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: never
          installed_at?: string | null
          kb?: string | null
          patch_name?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: never
          installed_at?: string | null
          kb?: string | null
          patch_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rmm_patches_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices_normalized"
            referencedColumns: ["device_id"]
          },
        ]
      }
      s1_threats: {
        Row: {
          account: string | null
          agent_version: string | null
          agent_version_on_detection: string | null
          analyst_verdict: string | null
          classification: string | null
          completed_actions: string | null
          confidence_level: string | null
          created_at: string | null
          detecting_engine: string | null
          endpoints: string | null
          external_ticket_id: string | null
          failed_actions: string | null
          group_name: string | null
          hash: string | null
          id: number
          identifying_time_utc: string | null
          incident_status: string | null
          initiated_by: string | null
          mitigated_preemptively: boolean | null
          originating_process: string | null
          path: string | null
          pending_actions: string | null
          policy_at_detection: string | null
          reboot_required: boolean | null
          reported_time_utc: string | null
          site: string | null
          status: string | null
          threat_details: string | null
        }
        Insert: {
          account?: string | null
          agent_version?: string | null
          agent_version_on_detection?: string | null
          analyst_verdict?: string | null
          classification?: string | null
          completed_actions?: string | null
          confidence_level?: string | null
          created_at?: string | null
          detecting_engine?: string | null
          endpoints?: string | null
          external_ticket_id?: string | null
          failed_actions?: string | null
          group_name?: string | null
          hash?: string | null
          id?: number
          identifying_time_utc?: string | null
          incident_status?: string | null
          initiated_by?: string | null
          mitigated_preemptively?: boolean | null
          originating_process?: string | null
          path?: string | null
          pending_actions?: string | null
          policy_at_detection?: string | null
          reboot_required?: boolean | null
          reported_time_utc?: string | null
          site?: string | null
          status?: string | null
          threat_details?: string | null
        }
        Update: {
          account?: string | null
          agent_version?: string | null
          agent_version_on_detection?: string | null
          analyst_verdict?: string | null
          classification?: string | null
          completed_actions?: string | null
          confidence_level?: string | null
          created_at?: string | null
          detecting_engine?: string | null
          endpoints?: string | null
          external_ticket_id?: string | null
          failed_actions?: string | null
          group_name?: string | null
          hash?: string | null
          id?: number
          identifying_time_utc?: string | null
          incident_status?: string | null
          initiated_by?: string | null
          mitigated_preemptively?: boolean | null
          originating_process?: string | null
          path?: string | null
          pending_actions?: string | null
          policy_at_detection?: string | null
          reboot_required?: boolean | null
          reported_time_utc?: string | null
          site?: string | null
          status?: string | null
          threat_details?: string | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          created_at: string | null
          customer: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          customer: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          customer?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      sites_normalized: {
        Row: {
          created_at: string | null
          customer_key: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          customer_key: string
          id?: never
          name: string
        }
        Update: {
          created_at?: string | null
          customer_key?: string
          id?: never
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_normalized_customer_key_fkey"
            columns: ["customer_key"]
            isOneToOne: false
            referencedRelation: "customers_normalized"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "sites_normalized_customer_key_fkey"
            columns: ["customer_key"]
            isOneToOne: false
            referencedRelation: "v_customer_overview"
            referencedColumns: ["customer_key"]
          },
        ]
      }
      staging_nable_devices: {
        Row: {
          av_installed: boolean | null
          av_product: string | null
          av_status: string | null
          created_at: string | null
          customer_name: string | null
          device_id: string
          hostname: string | null
          last_seen_utc: string | null
          site_name: string | null
        }
        Insert: {
          av_installed?: boolean | null
          av_product?: string | null
          av_status?: string | null
          created_at?: string | null
          customer_name?: string | null
          device_id: string
          hostname?: string | null
          last_seen_utc?: string | null
          site_name?: string | null
        }
        Update: {
          av_installed?: boolean | null
          av_product?: string | null
          av_status?: string | null
          created_at?: string | null
          customer_name?: string | null
          device_id?: string
          hostname?: string | null
          last_seen_utc?: string | null
          site_name?: string | null
        }
        Relationships: []
      }
      staging_s1_agents: {
        Row: {
          agent_id: string
          agent_version: string | null
          created_at: string | null
          customer_name: string | null
          hostname: string | null
          last_seen_utc: string | null
          s1_present: boolean | null
          site_name: string | null
        }
        Insert: {
          agent_id: string
          agent_version?: string | null
          created_at?: string | null
          customer_name?: string | null
          hostname?: string | null
          last_seen_utc?: string | null
          s1_present?: boolean | null
          site_name?: string | null
        }
        Update: {
          agent_id?: string
          agent_version?: string | null
          created_at?: string | null
          customer_name?: string | null
          hostname?: string | null
          last_seen_utc?: string | null
          s1_present?: boolean | null
          site_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_av_device: {
        Row: {
          av_enabled: boolean | null
          av_product: string | null
          client_key: string | null
          device_key: string | null
        }
        Relationships: []
      }
      v_backup_device: {
        Row: {
          backups_enabled: boolean | null
          client_key: string | null
          device_key: string | null
          failed: boolean | null
          healthy: boolean | null
          status: string | null
          warning: boolean | null
        }
        Relationships: []
      }
      v_backup_rollup: {
        Row: {
          backup_health_pct: number | null
          backups_failed: number | null
          backups_healthy: number | null
          client_key: string | null
          devices_with_backups: number | null
          site_key: string | null
        }
        Relationships: []
      }
      v_coffee_report_customer_summary: {
        Row: {
          backup_health_pct: number | null
          customer: string | null
          devices_monitored: number | null
          devices_with_backups: number | null
          last_refreshed_at: string | null
          patch_compliance_pct: number | null
          patch_scope_devices: number | null
          s1_threats_30d: number | null
          security_coverage_pct: number | null
        }
        Relationships: []
      }
      v_coffee_report_device_detail: {
        Row: {
          av_enabled: boolean | null
          backup_status: string | null
          backups_enabled: boolean | null
          client_key: string | null
          device_name: string | null
          patches_installed: number | null
          patches_pending: number | null
          protected: boolean | null
          s1_present: boolean | null
          s1_threats_30d: number | null
          site_key: string | null
        }
        Relationships: []
      }
      v_coffee_report_site_summary: {
        Row: {
          backup_health_pct: number | null
          client_key: string | null
          devices_monitored: number | null
          devices_with_backups: number | null
          patch_compliance_pct: number | null
          security_coverage_pct: number | null
          site: string | null
          threats_30d: number | null
        }
        Relationships: []
      }
      v_customer_nandos: {
        Row: {
          customer_key: string | null
          customer_name: string | null
        }
        Relationships: []
      }
      v_customer_overview: {
        Row: {
          backup_success: number | null
          customer: string | null
          customer_key: string | null
          devices: number | null
          devices_offline: number | null
          devices_online: number | null
          patch_compliance: number | null
          s1_threats_active: number | null
          s1_threats_total: number | null
        }
        Relationships: []
      }
      v_customers_norm: {
        Row: {
          client_key: string | null
          id: number | null
          name: string | null
        }
        Insert: {
          client_key?: never
          id?: number | null
          name?: string | null
        }
        Update: {
          client_key?: never
          id?: number | null
          name?: string | null
        }
        Relationships: []
      }
      v_devices_catalog: {
        Row: {
          any_row_id: number | null
          client_key: string | null
          client_name: string | null
          device_key: string | null
          device_name: string | null
          site_key: string | null
          site_name: string | null
        }
        Relationships: []
      }
      v_monitored_devices: {
        Row: {
          client_key: string | null
          devices_monitored: number | null
          site_key: string | null
        }
        Relationships: []
      }
      v_nable_devices_norm: {
        Row: {
          av_installed: boolean | null
          av_product: string | null
          av_status: string | null
          customer_key: string | null
          device_id: string | null
          host_key: string | null
          hostname: string | null
          last_seen_utc: string | null
          site_key: string | null
          site_name: string | null
        }
        Insert: {
          av_installed?: never
          av_product?: string | null
          av_status?: string | null
          customer_key?: never
          device_id?: string | null
          host_key?: never
          hostname?: string | null
          last_seen_utc?: string | null
          site_key?: never
          site_name?: string | null
        }
        Update: {
          av_installed?: never
          av_product?: string | null
          av_status?: string | null
          customer_key?: never
          device_id?: string | null
          host_key?: never
          hostname?: string | null
          last_seen_utc?: string | null
          site_key?: never
          site_name?: string | null
        }
        Relationships: []
      }
      v_patching_device: {
        Row: {
          any_installed: boolean | null
          any_pending: boolean | null
          client_key: string | null
          device_key: string | null
          patches_installed: number | null
          patches_pending: number | null
          site_key: string | null
        }
        Relationships: []
      }
      v_patching_rollup: {
        Row: {
          client_key: string | null
          devices_compliant: number | null
          devices_total: number | null
          patch_compliance_pct: number | null
          site_key: string | null
        }
        Relationships: []
      }
      v_s1_agents_norm: {
        Row: {
          agent_id: string | null
          agent_version: string | null
          customer_key: string | null
          host_key: string | null
          hostname: string | null
          last_seen_utc: string | null
          s1_present: boolean | null
          site_key: string | null
          site_name: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_version?: string | null
          customer_key?: never
          host_key?: never
          hostname?: string | null
          last_seen_utc?: string | null
          s1_present?: never
          site_key?: never
          site_name?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_version?: string | null
          customer_key?: never
          host_key?: never
          hostname?: string | null
          last_seen_utc?: string | null
          s1_present?: never
          site_key?: never
          site_name?: string | null
        }
        Relationships: []
      }
      v_s1_device: {
        Row: {
          client_key: string | null
          device_key: string | null
          s1_present: boolean | null
          s1_threats_30d: number | null
        }
        Relationships: []
      }
      v_security_by_site_nandos: {
        Row: {
          av_devices: number | null
          protected_devices: number | null
          s1_devices: number | null
          site_name: string | null
          total_devices: number | null
          unprotected_devices: number | null
        }
        Relationships: []
      }
      v_security_device: {
        Row: {
          av_enabled: boolean | null
          client_key: string | null
          device_key: string | null
          protected: boolean | null
          s1_present: boolean | null
          s1_threats_30d: number | null
          site_key: string | null
        }
        Relationships: []
      }
      v_security_device_nandos: {
        Row: {
          agent_version: string | null
          av_installed: boolean | null
          av_product: string | null
          av_status: string | null
          customer_key: string | null
          device_id: string | null
          hostname: string | null
          nable_last_seen: string | null
          s1_last_seen: string | null
          s1_present: boolean | null
          site_key: string | null
          site_name: string | null
        }
        Relationships: []
      }
      v_security_rollup: {
        Row: {
          client_key: string | null
          devices_protected: number | null
          devices_total: number | null
          security_coverage_pct: number | null
          site_key: string | null
          threats_30d: number | null
        }
        Relationships: []
      }
      v_security_split_nandos: {
        Row: {
          av_devices: number | null
          customer: string | null
          s1_devices: number | null
        }
        Relationships: []
      }
      v_security_summary_nandos: {
        Row: {
          customer: string | null
          protected_devices: number | null
          total_devices: number | null
          unprotected_devices: number | null
        }
        Relationships: []
      }
      v_sites_norm: {
        Row: {
          client_key: string | null
          client_name: string | null
          id: number | null
          site_key: string | null
          site_name: string | null
        }
        Insert: {
          client_key?: never
          client_name?: string | null
          id?: number | null
          site_key?: never
          site_name?: string | null
        }
        Update: {
          client_key?: never
          client_name?: string | null
          id?: number | null
          site_key?: never
          site_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      norm_txt: {
        Args: { t: string }
        Returns: string
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
