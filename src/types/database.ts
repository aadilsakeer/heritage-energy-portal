export type BillStatus =
  | 'draft'
  | 'published'
  | 'partially_paid'
  | 'paid'
  | 'archived'

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

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          slug: string
          name: string
          short_name: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          short_name: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          short_name?: string
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
