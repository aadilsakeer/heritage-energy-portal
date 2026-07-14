export type BillStatus =
  | 'draft'
  | 'published'
  | 'payment_pending_verification'
  | 'partially_paid'
  | 'paid'
  | 'archived'

export type PaymentRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export type NotificationType =
  | 'bill_published'
  | 'payment_requested'
  | 'payment_approved'
  | 'payment_rejected'
  | 'credit_created'
  | 'credit_applied'
  | 'bill_updated'
  | 'payment_edited'
  | 'payment_deleted'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BillEventType =
  | 'pdf_uploaded'
  | 'ai_completed'
  | 'edited'
  | 'published'
  | 'republished'
  | 'archived'
  | 'duplicated'
  | 'deleted'
  | 'payment_added'
  | 'payment_updated'
  | 'payment_deleted'
  | 'credit_created'
  | 'credit_applied'
  | 'credit_cancelled'
  | 'manual_credit_added'
  | 'payment_requested'
  | 'payment_approved'
  | 'payment_rejected'
  | 'notification_sent'
  | 'bill_updated'

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          slug: string
          name: string
          short_name: string
          consumer_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          short_name: string
          consumer_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          short_name?: string
          consumer_number?: string | null
          created_at?: string
        }
        Relationships: []
      }
      billing_configuration: {
        Row: {
          id: string
          property_id: string
          rate: number
          discount_percent: number
          fixed_charge: number
          effective_from: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          rate: number
          discount_percent: number
          fixed_charge: number
          effective_from?: string
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          rate?: number
          discount_percent?: number
          fixed_charge?: number
          effective_from?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'billing_configuration_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      bills: {
        Row: {
          id: string
          property_id: string
          billing_month: string
          status: BillStatus
          generation: number | null
          export_kwh: number | null
          import_kwh: number | null
          consumption: number | null
          energy_charge: number | null
          discount_amount: number | null
          fixed_charge: number | null
          tenant_total: number | null
          credit_applied: number
          amount_payable: number | null
          security_deposit: number
          arrears: number
          rate: number | null
          discount_percent: number | null
          pdf_path: string | null
          pdf_file_name: string | null
          due_date: string | null
          bill_date: string | null
          consumer_number: string | null
          invoice_number: string | null
          ai_json: Json | null
          validated_json: Json | null
          published_at: string | null
          created_at: string
          updated_at: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
        }
        Insert: {
          id?: string
          property_id: string
          billing_month: string
          status?: BillStatus
          generation?: number | null
          export_kwh?: number | null
          import_kwh?: number | null
          consumption?: number | null
          energy_charge?: number | null
          discount_amount?: number | null
          fixed_charge?: number | null
          tenant_total?: number | null
          credit_applied?: number
          amount_payable?: number | null
          security_deposit?: number
          arrears?: number
          rate?: number | null
          discount_percent?: number | null
          pdf_path?: string | null
          pdf_file_name?: string | null
          due_date?: string | null
          bill_date?: string | null
          consumer_number?: string | null
          invoice_number?: string | null
          ai_json?: Json | null
          validated_json?: Json | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          billing_month?: string
          status?: BillStatus
          generation?: number | null
          export_kwh?: number | null
          import_kwh?: number | null
          consumption?: number | null
          energy_charge?: number | null
          discount_amount?: number | null
          fixed_charge?: number | null
          tenant_total?: number | null
          credit_applied?: number
          amount_payable?: number | null
          security_deposit?: number
          arrears?: number
          rate?: number | null
          discount_percent?: number | null
          pdf_path?: string | null
          pdf_file_name?: string | null
          due_date?: string | null
          bill_date?: string | null
          consumer_number?: string | null
          invoice_number?: string | null
          ai_json?: Json | null
          validated_json?: Json | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'bills_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      bill_events: {
        Row: {
          id: string
          bill_id: string
          event_type: BillEventType
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          event_type: BillEventType
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          event_type?: BillEventType
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bill_events_bill_id_fkey'
            columns: ['bill_id']
            isOneToOne: false
            referencedRelation: 'bills'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          id: string
          bill_id: string
          amount: number
          payment_date: string
          payment_method: string
          reference: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          amount: number
          payment_date?: string
          payment_method?: string
          reference?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          amount?: number
          payment_date?: string
          payment_method?: string
          reference?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_bill_id_fkey'
            columns: ['bill_id']
            isOneToOne: false
            referencedRelation: 'bills'
            referencedColumns: ['id']
          },
        ]
      }
      payment_requests: {
        Row: {
          id: string
          bill_id: string
          property_id: string
          amount: number
          payment_method: string
          transaction_reference: string | null
          proof_url: string | null
          notes: string | null
          requested_at: string
          approved_at: string | null
          approved_by: string | null
          rejection_reason: string | null
          status: PaymentRequestStatus
        }
        Insert: {
          id?: string
          bill_id: string
          property_id: string
          amount: number
          payment_method?: string
          transaction_reference?: string | null
          proof_url?: string | null
          notes?: string | null
          requested_at?: string
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          status?: PaymentRequestStatus
        }
        Update: {
          id?: string
          bill_id?: string
          property_id?: string
          amount?: number
          payment_method?: string
          transaction_reference?: string | null
          proof_url?: string | null
          notes?: string | null
          requested_at?: string
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          status?: PaymentRequestStatus
        }
        Relationships: [
          {
            foreignKeyName: 'payment_requests_bill_id_fkey'
            columns: ['bill_id']
            isOneToOne: false
            referencedRelation: 'bills'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payment_requests_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          property_id: string
          bill_id: string | null
          title: string
          message: string
          type: NotificationType
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          bill_id?: string | null
          title: string
          message: string
          type: NotificationType
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          bill_id?: string | null
          title?: string
          message?: string
          type?: NotificationType
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_bill_id_fkey'
            columns: ['bill_id']
            isOneToOne: false
            referencedRelation: 'bills'
            referencedColumns: ['id']
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value?: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      account_adjustments: {
        Row: {
          id: string
          property_id: string
          bill_id: string | null
          amount: number
          reason: string
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          property_id: string
          bill_id?: string | null
          amount: number
          reason: string
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          bill_id?: string | null
          amount?: number
          reason?: string
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'account_adjustments_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      reminder_history: {
        Row: {
          id: string
          property_id: string
          bill_id: string | null
          stage: string
          due_date: string | null
          scheduled_for: string
          status: string
          message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          bill_id?: string | null
          stage: string
          due_date?: string | null
          scheduled_for: string
          status?: string
          message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          bill_id?: string | null
          stage?: string
          due_date?: string | null
          scheduled_for?: string
          status?: string
          message?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reminder_history_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      audit_events: {
        Row: {
          id: string
          property_id: string | null
          bill_id: string | null
          entity_type: string
          entity_id: string | null
          action: string
          actor: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          bill_id?: string | null
          entity_type: string
          entity_id?: string | null
          action: string
          actor?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          bill_id?: string | null
          entity_type?: string
          entity_id?: string | null
          action?: string
          actor?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      customer_credits: {
        Row: {
          id: string
          property_id: string
          bill_id: string | null
          amount: number
          reason: string
          remaining_amount: number
          created_at: string
          applied_at: string | null
          status: string
        }
        Insert: {
          id?: string
          property_id: string
          bill_id?: string | null
          amount: number
          reason: string
          remaining_amount: number
          created_at?: string
          applied_at?: string | null
          status?: string
        }
        Update: {
          id?: string
          property_id?: string
          bill_id?: string | null
          amount?: number
          reason?: string
          remaining_amount?: number
          created_at?: string
          applied_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_credits_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'customer_credits_bill_id_fkey'
            columns: ['bill_id']
            isOneToOne: false
            referencedRelation: 'bills'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      bill_status: BillStatus
    }
    CompositeTypes: Record<string, never>
  }
}

export type PropertyRow = Database['public']['Tables']['properties']['Row']
export type BillingConfigRow =
  Database['public']['Tables']['billing_configuration']['Row']
export type BillRow = Database['public']['Tables']['bills']['Row']
export type BillInsert = Database['public']['Tables']['bills']['Insert']
export type BillEventRow = Database['public']['Tables']['bill_events']['Row']
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']
export type CustomerCreditRow =
  Database['public']['Tables']['customer_credits']['Row']
export type CustomerCreditInsert =
  Database['public']['Tables']['customer_credits']['Insert']
export type CustomerCreditUpdate =
  Database['public']['Tables']['customer_credits']['Update']
export type PaymentRequestRow =
  Database['public']['Tables']['payment_requests']['Row']
export type PaymentRequestInsert =
  Database['public']['Tables']['payment_requests']['Insert']
export type PaymentRequestUpdate =
  Database['public']['Tables']['payment_requests']['Update']
export type NotificationRow =
  Database['public']['Tables']['notifications']['Row']
export type NotificationInsert =
  Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate =
  Database['public']['Tables']['notifications']['Update']
export type AppSettingsRow = Database['public']['Tables']['app_settings']['Row']
export type AccountAdjustmentRow =
  Database['public']['Tables']['account_adjustments']['Row']
export type AccountAdjustmentInsert =
  Database['public']['Tables']['account_adjustments']['Insert']
export type ReminderHistoryRow =
  Database['public']['Tables']['reminder_history']['Row']
export type AuditEventRow = Database['public']['Tables']['audit_events']['Row']
export type AuditEventInsert =
  Database['public']['Tables']['audit_events']['Insert']
