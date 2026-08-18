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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      attempts: {
        Row: {
          challenge_id: string
          code: string
          created_at: string
          duration_ms: number
          id: string
          mode: string
          passed: boolean
          tests_passed: number
          tests_total: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          challenge_id: string
          code?: string
          created_at?: string
          duration_ms?: number
          id?: string
          mode?: string
          passed?: boolean
          tests_passed?: number
          tests_total?: number
          user_id: string
          xp_awarded?: number
        }
        Update: {
          challenge_id?: string
          code?: string
          created_at?: string
          duration_ms?: number
          id?: string
          mode?: string
          passed?: boolean
          tests_passed?: number
          tests_total?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          brief: string
          created_at: string
          difficulty: number
          hints: Json
          id: string
          slug: string
          starter_code: string
          tests: Json
          title: string
          topic: string
          track: Database["public"]["Enums"]["track"]
          xp: number
        }
        Insert: {
          brief: string
          created_at?: string
          difficulty?: number
          hints?: Json
          id?: string
          slug: string
          starter_code?: string
          tests?: Json
          title: string
          topic: string
          track: Database["public"]["Enums"]["track"]
          xp?: number
        }
        Update: {
          brief?: string
          created_at?: string
          difficulty?: number
          hints?: Json
          id?: string
          slug?: string
          starter_code?: string
          tests?: Json
          title?: string
          topic?: string
          track?: Database["public"]["Enums"]["track"]
          xp?: number
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
          teacher_id: string
          track: Database["public"]["Enums"]["track"]
        }
        Insert: {
          created_at?: string
          id?: string
          join_code: string
          name: string
          teacher_id: string
          track?: Database["public"]["Enums"]["track"]
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          teacher_id?: string
          track?: Database["public"]["Enums"]["track"]
        }
        Relationships: []
      }
      duels: {
        Row: {
          challenge_id: string
          challenger_id: string
          challenger_ms: number | null
          class_id: string | null
          created_at: string
          id: string
          opponent_id: string
          opponent_ms: number | null
          status: string
          winner_id: string | null
        }
        Insert: {
          challenge_id: string
          challenger_id: string
          challenger_ms?: number | null
          class_id?: string | null
          created_at?: string
          id?: string
          opponent_id: string
          opponent_ms?: number | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          challenge_id?: string
          challenger_id?: string
          challenger_ms?: number | null
          class_id?: string | null
          created_at?: string
          id?: string
          opponent_id?: string
          opponent_ms?: number | null
          status?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duels_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duels_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          adaptive: boolean
          challenge_ids: string[]
          class_id: string
          created_at: string
          due_at: string | null
          id: string
          instructions: string
          title: string
        }
        Insert: {
          adaptive?: boolean
          challenge_ids?: string[]
          class_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string
          title: string
        }
        Update: {
          adaptive?: boolean
          challenge_ids?: string[]
          class_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          attempts: number
          id: string
          level: number
          passes: number
          topic: string
          track: Database["public"]["Enums"]["track"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          id?: string
          level?: number
          passes?: number
          topic: string
          track: Database["public"]["Enums"]["track"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          id?: string
          level?: number
          passes?: number
          topic?: string
          track?: Database["public"]["Enums"]["track"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stats: {
        Row: {
          best_streak: number
          last_active: string | null
          streak_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          best_streak?: number
          last_active?: string | null
          streak_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          best_streak?: number
          last_active?: string | null
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_user: {
        Args: { _target: string; _viewer: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      track: "gcse" | "alevel"
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
      app_role: ["admin", "teacher", "student"],
      track: ["gcse", "alevel"],
    },
  },
} as const
