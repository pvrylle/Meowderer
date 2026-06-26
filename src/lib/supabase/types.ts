export type Rarity = "common" | "uncommon" | "rare" | "epic";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Capture = {
  id: string;
  user_id: string;
  photo_url: string;
  sticker_url: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
  country: string | null;
  coat_type: string | null;
  rarity: Rarity | null;
  nickname: string | null;
  caught_at: string;
};

export type CaptureInsert = {
  id?: string;
  user_id: string;
  photo_url: string;
  sticker_url: string;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  country?: string | null;
  coat_type?: string | null;
  rarity?: Rarity | null;
  nickname?: string | null;
  caught_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      captures: {
        Row: Capture;
        Insert: CaptureInsert;
        Update: Partial<Capture>;
        Relationships: [];
      };
      achievements: {
        Row: { id: string; title: string; description: string | null; icon: string | null };
        Insert: { id: string; title: string; description?: string | null; icon?: string | null };
        Update: Partial<{ title: string; description: string | null; icon: string | null }>;
        Relationships: [];
      };
      user_achievements: {
        Row: { user_id: string; achievement_id: string; unlocked_at: string };
        Insert: { user_id: string; achievement_id: string; unlocked_at?: string };
        Update: Partial<{ unlocked_at: string }>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
