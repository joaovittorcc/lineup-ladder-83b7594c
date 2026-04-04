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
      challenges: {
        Row: {
          accepted_at: string | null
          challenged_id: string
          challenged_name: string
          challenged_pos: number
          challenger_id: string
          challenger_name: string
          challenger_pos: number
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          list_id: string
          score_challenged: number
          score_challenger: number
          status: Database["public"]["Enums"]["challenge_status"]
          tracks: string[] | null
          type: Database["public"]["Enums"]["challenge_type"]
          winner_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          challenged_id: string
          challenged_name: string
          challenged_pos: number
          challenger_id: string
          challenger_name: string
          challenger_pos: number
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          list_id: string
          score_challenged?: number
          score_challenger?: number
          status?: Database["public"]["Enums"]["challenge_status"]
          tracks?: string[] | null
          type?: Database["public"]["Enums"]["challenge_type"]
          winner_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          challenged_id?: string
          challenged_name?: string
          challenged_pos?: number
          challenger_id?: string
          challenger_name?: string
          challenger_pos?: number
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          list_id?: string
          score_challenged?: number
          score_challenger?: number
          status?: Database["public"]["Enums"]["challenge_status"]
          tracks?: string[] | null
          type?: Database["public"]["Enums"]["challenge_type"]
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_challenged_id_fkey"
            columns: ["challenged_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "player_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_race_results: {
        Row: {
          created_at: string
          finish_position: number
          id: string
          points: number
          race_number: number
          registration_id: string
          season_id: string
        }
        Insert: {
          created_at?: string
          finish_position: number
          id?: string
          points?: number
          race_number: number
          registration_id: string
          season_id: string
        }
        Update: {
          created_at?: string
          finish_position?: number
          id?: string
          points?: number
          race_number?: number
          registration_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_race_results_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "championship_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_race_results_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_race_tracks: {
        Row: {
          created_at: string
          id: string
          race_number: number
          season_id: string
          track_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          race_number: number
          season_id: string
          track_name: string
        }
        Update: {
          created_at?: string
          id?: string
          race_number?: number
          season_id?: string
          track_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_race_tracks_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_registrations: {
        Row: {
          car: string
          created_at: string
          id: string
          pilot_name: string
          season_id: string
        }
        Insert: {
          car: string
          created_at?: string
          id?: string
          pilot_name: string
          season_id: string
        }
        Update: {
          car?: string
          created_at?: string
          id?: string
          pilot_name?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_registrations_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_seasons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phase: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phase?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phase?: string
        }
        Relationships: []
      }
      global_logs: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          player_one: string | null
          player_two: string | null
          type: string
          winner: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          player_one?: string | null
          player_two?: string | null
          type: string
          winner?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          player_one?: string | null
          player_two?: string | null
          type?: string
          winner?: string | null
        }
        Relationships: []
      }
      joker_progress: {
        Row: {
          defeated_at: string
          defeated_player_id: string
          id: string
          joker_user_id: string
        }
        Insert: {
          defeated_at?: string
          defeated_player_id: string
          id?: string
          joker_user_id: string
        }
        Update: {
          defeated_at?: string
          defeated_player_id?: string
          id?: string
          joker_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "joker_progress_defeated_player_id_fkey"
            columns: ["defeated_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_lists: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          challenge_cooldown_until: string | null
          cooldown_until: string | null
          created_at: string
          defense_count: number
          id: string
          initiation_complete: boolean
          list_id: string
          name: string
          position: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          challenge_cooldown_until?: string | null
          cooldown_until?: string | null
          created_at?: string
          defense_count?: number
          id?: string
          initiation_complete?: boolean
          list_id: string
          name: string
          position: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          challenge_cooldown_until?: string | null
          cooldown_until?: string | null
          created_at?: string
          defense_count?: number
          id?: string
          initiation_complete?: boolean
          list_id?: string
          name?: string
          position?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "player_lists"
            referencedColumns: ["id"]
          },
        ]
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
      check_expired_cooldowns: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_expired_challenges: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "pilot" | "joker"
      challenge_status:
        | "pending"
        | "accepted"
        | "racing"
        | "completed"
        | "wo"
        | "cancelled"
      challenge_type: "ladder" | "initiation"
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
      app_role: ["admin", "pilot", "joker"],
      challenge_status: [
        "pending",
        "accepted",
        "racing",
        "completed",
        "wo",
        "cancelled",
      ],
      challenge_type: ["ladder", "initiation"],
    },
  },
} as const
