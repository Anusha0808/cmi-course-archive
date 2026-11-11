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
      course_requests: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          requested_by: string
          status: string
          subject: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          requested_by: string
          status?: string
          subject: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          requested_by?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          subject: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          subject?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      member_websites: {
        Row: {
          created_at: string
          description: string
          id: string
          owner_id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          owner_id: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_websites_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string
          display_name: string
          id: string
        }
        Insert: {
          bio?: string
          display_name?: string
          id: string
        }
        Update: {
          bio?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      resource_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
          resource_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          reason: string
          reporter_id: string
          resource_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
          resource_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_reports_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_updates: {
        Row: {
          academic_year: string | null
          author_name: string
          base_version: number
          course_id: string
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          kind: Database["public"]["Enums"]["resource_kind"]
          resource_id: string
          reviewed_at: string | null
          section: string
          status: string
          tags: string[]
          title: string
          uploader_id: string
          url: string | null
        }
        Insert: {
          academic_year?: string | null
          author_name: string
          base_version?: number
          course_id: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          kind: Database["public"]["Enums"]["resource_kind"]
          resource_id: string
          reviewed_at?: string | null
          section?: string
          status?: string
          tags?: string[]
          title: string
          uploader_id: string
          url?: string | null
        }
        Update: {
          academic_year?: string | null
          author_name?: string
          base_version?: number
          course_id?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["resource_kind"]
          resource_id?: string
          reviewed_at?: string | null
          section?: string
          status?: string
          tags?: string[]
          title?: string
          uploader_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_updates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_updates_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          academic_year: string | null
          author_name: string
          course_id: string
          course_request_id: string | null
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          kind: Database["public"]["Enums"]["resource_kind"]
          revision_number: number
          section: string
          status: Database["public"]["Enums"]["resource_status"]
          tags: string[]
          title: string
          uploader_id: string
          url: string | null
        }
        Insert: {
          academic_year?: string | null
          author_name: string
          course_id: string
          course_request_id?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          kind: Database["public"]["Enums"]["resource_kind"]
          revision_number?: number
          section?: string
          status?: Database["public"]["Enums"]["resource_status"]
          tags?: string[]
          title: string
          uploader_id: string
          url?: string | null
        }
        Update: {
          academic_year?: string | null
          author_name?: string
          course_id?: string
          course_request_id?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["resource_kind"]
          revision_number?: number
          section?: string
          status?: Database["public"]["Enums"]["resource_status"]
          tags?: string[]
          title?: string
          uploader_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_course_request_id_fkey"
            columns: ["course_request_id"]
            isOneToOne: false
            referencedRelation: "course_requests"
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
      approve_course_request: { Args: { _id: string }; Returns: string }
      archive_email_allowed: { Args: { email: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      moderator_member_directory: {
        Args: never
        Returns: {
          bio: string
          display_name: string
          email: string
          id: string
          is_moderator: boolean
          joined_at: string
          upload_count: number
        }[]
      }
      review_resource_update: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      resource_kind: "pdf" | "tex" | "typst" | "link" | "markdown"
      resource_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      resource_kind: ["pdf", "tex", "typst", "link", "markdown"],
      resource_status: ["pending", "approved", "rejected"],
    },
  },
} as const
