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
      chapters: {
        Row: {
          created_at: string
          id: string
          name: string
          subject: Database["public"]["Enums"]["app_subject"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          subject: Database["public"]["Enums"]["app_subject"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          subject?: Database["public"]["Enums"]["app_subject"]
          user_id?: string
        }
        Relationships: []
      }
      login_events: {
        Row: {
          email: string | null
          id: string
          logged_in_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          email?: string | null
          id?: string
          logged_in_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          email?: string | null
          id?: string
          logged_in_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class_level: Database["public"]["Enums"]["app_class_level"] | null
          created_at: string
          daily_goal: number
          display_name: string | null
          id: string
          reminder_enabled: boolean
          reminder_last_sent_on: string | null
          reminder_time: string
          reminder_tz_offset: number
          stream: Database["public"]["Enums"]["app_stream"] | null
          target_year: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          class_level?: Database["public"]["Enums"]["app_class_level"] | null
          created_at?: string
          daily_goal?: number
          display_name?: string | null
          id: string
          reminder_enabled?: boolean
          reminder_last_sent_on?: string | null
          reminder_time?: string
          reminder_tz_offset?: number
          stream?: Database["public"]["Enums"]["app_stream"] | null
          target_year?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          class_level?: Database["public"]["Enums"]["app_class_level"] | null
          created_at?: string
          daily_goal?: number
          display_name?: string | null
          id?: string
          reminder_enabled?: boolean
          reminder_last_sent_on?: string | null
          reminder_time?: string
          reminder_tz_offset?: number
          stream?: Database["public"]["Enums"]["app_stream"] | null
          target_year?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_logs: {
        Row: {
          chapter_id: string | null
          count: number
          created_at: string
          exam_level: Database["public"]["Enums"]["app_exam_level"] | null
          id: string
          logged_on: string
          source_id: string | null
          subject: Database["public"]["Enums"]["app_subject"]
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          count: number
          created_at?: string
          exam_level?: Database["public"]["Enums"]["app_exam_level"] | null
          id?: string
          logged_on?: string
          source_id?: string | null
          subject: Database["public"]["Enums"]["app_subject"]
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          count?: number
          created_at?: string
          exam_level?: Database["public"]["Enums"]["app_exam_level"] | null
          id?: string
          logged_on?: string
          source_id?: string | null
          subject?: Database["public"]["Enums"]["app_subject"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_logs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          created_at: string
          done: boolean
          id: string
          position: number
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          task_id: string
          title: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          chapter_id: string | null
          completed_at: string | null
          created_at: string
          due_on: string | null
          due_time: string | null
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["app_task_priority"]
          question_target: number | null
          reminder_last_sent_on: string | null
          reminder_time: string | null
          repeat_rule: Json | null
          sort_order: number
          subject: Database["public"]["Enums"]["app_subject"] | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_on?: string | null
          due_time?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["app_task_priority"]
          question_target?: number | null
          reminder_last_sent_on?: string | null
          reminder_time?: string | null
          repeat_rule?: Json | null
          sort_order?: number
          subject?: Database["public"]["Enums"]["app_subject"] | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_on?: string | null
          due_time?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["app_task_priority"]
          question_target?: number | null
          reminder_last_sent_on?: string | null
          reminder_time?: string | null
          repeat_rule?: Json | null
          sort_order?: number
          subject?: Database["public"]["Enums"]["app_subject"] | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_class_level:
        | "class_9"
        | "class_10"
        | "class_11"
        | "class_12"
        | "dropper"
      app_exam_level: "main" | "advanced" | "section_a" | "section_b"
      app_role: "admin" | "user"
      app_stream: "jee" | "neet"
      app_subject: "physics" | "chemistry" | "math" | "biology"
      app_task_priority: "low" | "medium" | "high"
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
    Enums: {
      app_class_level: [
        "class_9",
        "class_10",
        "class_11",
        "class_12",
        "dropper",
      ],
      app_exam_level: ["main", "advanced", "section_a", "section_b"],
      app_role: ["admin", "user"],
      app_stream: ["jee", "neet"],
      app_subject: ["physics", "chemistry", "math", "biology"],
      app_task_priority: ["low", "medium", "high"],
    },
  },
} as const
