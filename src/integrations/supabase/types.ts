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
      assinaturas: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          id: string
          mp_subscription_id: string | null
          plano: string
          proximo_pagamento: string | null
          responsavel_id: string
          status: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          mp_subscription_id?: string | null
          plano: string
          proximo_pagamento?: string | null
          responsavel_id: string
          status?: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          mp_subscription_id?: string | null
          plano?: string
          proximo_pagamento?: string | null
          responsavel_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      familia_vinculos: {
        Row: {
          codigo: string
          criado_em: string | null
          expira_em: string | null
          filho_id: string
          id: string
          responsavel_id: string | null
          usado: boolean | null
        }
        Insert: {
          codigo: string
          criado_em?: string | null
          expira_em?: string | null
          filho_id: string
          id?: string
          responsavel_id?: string | null
          usado?: boolean | null
        }
        Update: {
          codigo?: string
          criado_em?: string | null
          expira_em?: string | null
          filho_id?: string
          id?: string
          responsavel_id?: string | null
          usado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "familia_vinculos_filho_id_fkey"
            columns: ["filho_id"]
            isOneToOne: false
            referencedRelation: "filhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "familia_vinculos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      filhos: {
        Row: {
          ano_escolar: Database["public"]["Enums"]["ano_escolar"]
          criado_em: string | null
          data_nascimento: string | null
          escola: string | null
          id: string
          nome: string
          responsavel_id: string
        }
        Insert: {
          ano_escolar: Database["public"]["Enums"]["ano_escolar"]
          criado_em?: string | null
          data_nascimento?: string | null
          escola?: string | null
          id?: string
          nome: string
          responsavel_id: string
        }
        Update: {
          ano_escolar?: Database["public"]["Enums"]["ano_escolar"]
          criado_em?: string | null
          data_nascimento?: string | null
          escola?: string | null
          id?: string
          nome?: string
          responsavel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filhos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          criado_em: string | null
          id: string
          ordem: number | null
          plano_id: string
          storage_path: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          ordem?: number | null
          plano_id: string
          storage_path: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          ordem?: number | null
          plano_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          atualizado_em: string | null
          conteudo_json: Json | null
          criado_em: string | null
          data_prova: string
          disciplina: string
          erro_mensagem: string | null
          filho_id: string
          id: string
          observacoes: string | null
          prompt_version: string
          status: Database["public"]["Enums"]["status_plano"]
        }
        Insert: {
          atualizado_em?: string | null
          conteudo_json?: Json | null
          criado_em?: string | null
          data_prova: string
          disciplina: string
          erro_mensagem?: string | null
          filho_id: string
          id?: string
          observacoes?: string | null
          prompt_version?: string
          status?: Database["public"]["Enums"]["status_plano"]
        }
        Update: {
          atualizado_em?: string | null
          conteudo_json?: Json | null
          criado_em?: string | null
          data_prova?: string
          disciplina?: string
          erro_mensagem?: string | null
          filho_id?: string
          id?: string
          observacoes?: string | null
          prompt_version?: string
          status?: Database["public"]["Enums"]["status_plano"]
        }
        Relationships: [
          {
            foreignKeyName: "planos_filho_id_fkey"
            columns: ["filho_id"]
            isOneToOne: false
            referencedRelation: "filhos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          criado_em: string | null
          email: string
          id: string
          nome: string
          termos_lgpd_at: string | null
          tipo: Database["public"]["Enums"]["tipo_usuario"]
        }
        Insert: {
          criado_em?: string | null
          email: string
          id: string
          nome: string
          termos_lgpd_at?: string | null
          tipo?: Database["public"]["Enums"]["tipo_usuario"]
        }
        Update: {
          criado_em?: string | null
          email?: string
          id?: string
          nome?: string
          termos_lgpd_at?: string | null
          tipo?: Database["public"]["Enums"]["tipo_usuario"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ano_escolar:
        | "1_EF"
        | "2_EF"
        | "3_EF"
        | "4_EF"
        | "5_EF"
        | "6_EF"
        | "olimpiadas"
      status_plano: "gerando" | "ativo" | "concluido" | "erro"
      tipo_usuario: "responsavel" | "aluno"
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
    Enums: {
      ano_escolar: [
        "1_EF",
        "2_EF",
        "3_EF",
        "4_EF",
        "5_EF",
        "6_EF",
        "olimpiadas",
      ],
      status_plano: ["gerando", "ativo", "concluido", "erro"],
      tipo_usuario: ["responsavel", "aluno"],
    },
  },
} as const
