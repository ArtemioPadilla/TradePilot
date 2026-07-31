/**
 * Generated Supabase types — do not edit by hand.
 *
 * Regenerate after every migration with the Supabase MCP
 * `generate_typescript_types` tool (or `supabase gen types typescript`)
 * against project qxijjzqfrnthdvwmisjx, and paste the output here.
 * Last generated: after 20260731041911_phase1_trading_schema.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          broker: string | null;
          created_at: string;
          currency: string;
          id: string;
          name: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          broker?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          name: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          broker?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          condition: Json;
          created_at: string;
          id: string;
          is_active: boolean;
          symbol: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          condition?: Json;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          symbol: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          condition?: Json;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          symbol?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      backtests: {
        Row: {
          config: Json;
          created_at: string;
          equity_curve: Json;
          id: string;
          is_public: boolean;
          metrics: Json;
          strategy_id: string | null;
          user_id: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          equity_curve?: Json;
          id?: string;
          is_public?: boolean;
          metrics?: Json;
          strategy_id?: string | null;
          user_id?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          equity_curve?: Json;
          id?: string;
          is_public?: boolean;
          metrics?: Json;
          strategy_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'backtests_strategy_id_fkey';
            columns: ['strategy_id'];
            isOneToOne: false;
            referencedRelation: 'strategies';
            referencedColumns: ['id'];
          },
        ];
      };
      holdings: {
        Row: {
          account_id: string;
          cost_basis: number | null;
          created_at: string;
          id: string;
          qty: number;
          symbol: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          cost_basis?: number | null;
          created_at?: string;
          id?: string;
          qty?: number;
          symbol: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          cost_basis?: number | null;
          created_at?: string;
          id?: string;
          qty?: number;
          symbol?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'holdings_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          account_id: string | null;
          created_at: string;
          id: string;
          qty: number;
          side: string;
          status: string;
          symbol: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          created_at?: string;
          id?: string;
          qty: number;
          side: string;
          status?: string;
          symbol: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          account_id?: string | null;
          created_at?: string;
          id?: string;
          qty?: number;
          side?: string;
          status?: string;
          symbol?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      strategies: {
        Row: {
          code: string | null;
          created_at: string;
          id: string;
          is_public: boolean;
          name: string;
          params: Json;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          id?: string;
          is_public?: boolean;
          name: string;
          params?: Json;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          id?: string;
          is_public?: boolean;
          name?: string;
          params?: Json;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string;
          created_at: string;
          executed_at: string;
          id: string;
          price: number | null;
          qty: number;
          side: string;
          symbol: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          executed_at?: string;
          id?: string;
          price?: number | null;
          qty: number;
          side: string;
          symbol: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          executed_at?: string;
          id?: string;
          price?: number | null;
          qty?: number;
          side?: string;
          symbol?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
      watchlists: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          symbols: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          symbols?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          symbols?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
