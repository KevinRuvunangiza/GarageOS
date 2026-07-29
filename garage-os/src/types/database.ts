export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FuelLevel = 'E' | '1/4' | '1/2' | '3/4' | 'F'

export interface Database {
  public: {
    Tables: {
      garages: {
        Row: {
          id: string
          garage_name: string
          garage_address: string
          personal_phone: string
          garage_phone: string
          subscription_status: 'pending' | 'active_lifetime' | 'active_trial' | 'expired'
          trial_ends_at: string | null
          applied_promo_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          garage_name: string
          garage_address: string
          personal_phone: string
          garage_phone: string
          subscription_status?: 'pending' | 'active_lifetime' | 'active_trial' | 'expired'
          trial_ends_at?: string | null
          applied_promo_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          garage_name?: string
          garage_address?: string
          personal_phone?: string
          garage_phone?: string
          subscription_status?: 'pending' | 'active_lifetime' | 'active_trial' | 'expired'
          trial_ends_at?: string | null
          applied_promo_code?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garages_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          garage_id: string
          name: string
          phone_number: string
          email: string
          address: string
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          garage_id?: string
          name: string
          phone_number: string
          email?: string
          address?: string
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          garage_id?: string
          name?: string
          phone_number?: string
          email?: string
          address?: string
          notes?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_garage_id_fkey"
            columns: ["garage_id"]
            referencedRelation: "garages"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicles: {
        Row: {
          id: string
          garage_id: string
          client_id: string
          make: string
          model: string
          year: number | null
          license_plate: string
          vin: string
          created_at: string
        }
        Insert: {
          id?: string
          garage_id?: string
          client_id: string
          make: string
          model: string
          year?: number | null
          license_plate: string
          vin?: string
          created_at?: string
        }
        Update: {
          id?: string
          garage_id?: string
          client_id?: string
          make?: string
          model?: string
          year?: number | null
          license_plate?: string
          vin?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_garage_id_fkey"
            columns: ["garage_id"]
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          garage_id: string
          vehicle_id: string
          status: 'pending' | 'in_progress' | 'done' | 'paid'
          issue_description: string
          total_estimated_cost: number
          fuel_level: FuelLevel | null
          pre_existing_damage: string[]
          odometer_km: number
          parts_cost_total: number
          labor_cost_total: number
          grand_total: number
          created_at: string
          updated_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          garage_id?: string
          vehicle_id: string
          status?: 'pending' | 'in_progress' | 'done' | 'paid'
          issue_description: string
          total_estimated_cost?: number
          fuel_level?: FuelLevel | null
          pre_existing_damage?: string[]
          odometer_km?: number
          parts_cost_total?: number
          labor_cost_total?: number
          grand_total?: number
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          garage_id?: string
          vehicle_id?: string
          status?: 'pending' | 'in_progress' | 'done' | 'paid'
          issue_description?: string
          total_estimated_cost?: number
          fuel_level?: FuelLevel | null
          pre_existing_damage?: string[]
          odometer_km?: number
          parts_cost_total?: number
          labor_cost_total?: number
          grand_total?: number
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_garage_id_fkey"
            columns: ["garage_id"]
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      job_items: {
        Row: {
          id: string
          garage_id: string
          job_id: string
          type: 'part' | 'labor'
          description: string
          cost: number
          created_at: string
        }
        Insert: {
          id?: string
          garage_id?: string
          job_id: string
          type: 'part' | 'labor'
          description: string
          cost: number
          created_at?: string
        }
        Update: {
          id?: string
          garage_id?: string
          job_id?: string
          type?: 'part' | 'labor'
          description?: string
          cost?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_items_garage_id_fkey"
            columns: ["garage_id"]
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_job_id_fkey"
            columns: ["job_id"]
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      preset_services: {
        Row: {
          id: string
          garage_id: string
          name: string
          title?: string
          default_cost: number
          default_price?: number
          type: 'part' | 'labor'
          category?: 'part' | 'labor'
          created_at: string
        }
        Insert: {
          id?: string
          garage_id?: string
          name: string
          title?: string
          default_cost: number
          default_price?: number
          type: 'part' | 'labor'
          category?: 'part' | 'labor'
          created_at?: string
        }
        Update: {
          id?: string
          garage_id?: string
          name?: string
          title?: string
          default_cost?: number
          default_price?: number
          type?: 'part' | 'labor'
          category?: 'part' | 'labor'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preset_services_garage_id_fkey"
            columns: ["garage_id"]
            referencedRelation: "garages"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      delete_garage_account: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      apply_promo_code: {
        Args: { garage_id: string; promo_code: string }
        Returns: { success: boolean; type?: string; message?: string }
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Garage = Database['public']['Tables']['garages']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type JobItem = Database['public']['Tables']['job_items']['Row']
export type PresetService = Database['public']['Tables']['preset_services']['Row']

export type JobWithDetails = Job & {
  vehicles: Vehicle & {
    clients: Client
  }
  job_items: JobItem[]
}
