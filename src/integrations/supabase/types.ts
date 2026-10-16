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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      fuel_entries: {
        Row: {
          amount: number
          created_at: string
          entry_date: string
          id: string
          image: string | null
          litres: number
          ocr: Json | null
          party_id: string | null
          party_name: string
          product_id: string | null
          product_name: string | null
          rate: number | null
          shift: string | null
          signature: string | null
          vehicle: string
          verified: boolean
        }
        Insert: {
          amount: number
          created_at?: string
          entry_date: string
          id?: string
          image?: string | null
          litres: number
          ocr?: Json | null
          party_id?: string | null
          party_name: string
          product_id?: string | null
          product_name?: string | null
          rate?: number | null
          shift?: string | null
          signature?: string | null
          vehicle: string
          verified?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          entry_date?: string
          id?: string
          image?: string | null
          litres?: number
          ocr?: Json | null
          party_id?: string | null
          party_name?: string
          product_id?: string | null
          product_name?: string | null
          rate?: number | null
          shift?: string | null
          signature?: string | null
          vehicle?: string
          verified?: boolean
        }
        Relationships: []
      }
      gemini_keys: {
        Row: {
          account_name: string
          api_key: string
          created_at: string
          exhausted_at: string | null
          id: string
        }
        Insert: {
          account_name: string
          api_key: string
          created_at?: string
          exhausted_at?: string | null
          id?: string
        }
        Update: {
          account_name?: string
          api_key?: string
          created_at?: string
          exhausted_at?: string | null
          id?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          active: boolean
          created_at: string
          credit_limit: number | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          credit_limit?: number | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          credit_limit?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          final_amount: number
          id: string
          party_id: string | null
          party_name: string
          pay_date: string
          remark: string | null
          tcs: number
          tds: number
        }
        Insert: {
          amount: number
          created_at?: string
          final_amount: number
          id?: string
          party_id?: string | null
          party_name: string
          pay_date: string
          remark?: string | null
          tcs?: number
          tds?: number
        }
        Update: {
          amount?: number
          created_at?: string
          final_amount?: number
          id?: string
          party_id?: string | null
          party_name?: string
          pay_date?: string
          remark?: string | null
          tcs?: number
          tds?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      product_rates: {
        Row: {
          created_at: string
          id: string
          product_id: string
          rate: number
          rate_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          rate: number
          rate_date: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          rate?: number
          rate_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_rates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          number: string
          party_id: string | null
          tank_capacity: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          number: string
          party_id?: string | null
          tank_capacity?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          number?: string
          party_id?: string | null
          tank_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
