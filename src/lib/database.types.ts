export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      dependencies: {
        Row: {
          created_at: string;
          depends_on_issue_id: string;
          issue_id: string;
        };
        Insert: {
          created_at?: string;
          depends_on_issue_id: string;
          issue_id: string;
        };
        Update: {
          created_at?: string;
          depends_on_issue_id?: string;
          issue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dependencies_depends_on_issue_id_fkey';
            columns: ['depends_on_issue_id'];
            isOneToOne: false;
            referencedRelation: 'issues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dependencies_issue_id_fkey';
            columns: ['issue_id'];
            isOneToOne: false;
            referencedRelation: 'issues';
            referencedColumns: ['id'];
          },
        ];
      };
      epics: {
        Row: {
          created_at: string;
          id: string;
          is_default: boolean;
          name: string;
          number: number;
          project_id: string;
          sort_order: number | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          number?: number;
          project_id: string;
          sort_order?: number | null;
          status: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          number?: number;
          project_id?: string;
          sort_order?: number | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'epics_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      issues: {
        Row: {
          created_at: string;
          epic_id: string;
          id: string;
          milestone_id: string | null;
          number: number;
          parent_issue_id: string | null;
          priority: number;
          project_id: string;
          sort_order: number | null;
          status: string;
          story_points: number | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          epic_id: string;
          id?: string;
          milestone_id?: string | null;
          number?: number;
          parent_issue_id?: string | null;
          priority: number;
          project_id: string;
          sort_order?: number | null;
          status: string;
          story_points?: number | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          epic_id?: string;
          id?: string;
          milestone_id?: string | null;
          number?: number;
          parent_issue_id?: string | null;
          priority?: number;
          project_id?: string;
          sort_order?: number | null;
          status?: string;
          story_points?: number | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'issues_epic_id_fkey';
            columns: ['epic_id'];
            isOneToOne: false;
            referencedRelation: 'epics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'issues_milestone_id_fkey';
            columns: ['milestone_id'];
            isOneToOne: false;
            referencedRelation: 'milestones';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'issues_parent_issue_id_fkey';
            columns: ['parent_issue_id'];
            isOneToOne: false;
            referencedRelation: 'issues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'issues_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      milestones: {
        Row: {
          created_at: string;
          due_date: string | null;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          due_date?: string | null;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          due_date?: string | null;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          name: string;
          number: number;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          number?: number;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          number?: number;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_dependency_cycle: {
        Args: { new_depends_on_id: string; new_issue_id: string };
        Returns: boolean;
      };
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
