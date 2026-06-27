export type Rarity = "common" | "uncommon" | "rare" | "epic";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  streak_count: number;
  last_capture_date: string | null;
  daily_goal: number;
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

export type Mission = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  target_count: number;
  metric_type: string;
};

export type UserMission = {
  user_id: string;
  mission_id: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
};

export type Badge = {
  id: string;
  title: string;
  icon: string | null;
  color: string | null;
  max_level: number;
  metric_type: string;
};

export type UserBadge = {
  user_id: string;
  badge_id: string;
  level: number;
  xp: number;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  category: string;
  capture_id: string | null;
  lat: number | null;
  lng: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  channel: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type RescueAlert = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  lat: number | null;
  lng: number | null;
  urgent: boolean;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type UserShelterVisit = {
  user_id: string;
  osm_id: string;
  lat: number;
  lng: number;
  name: string | null;
  visited_at: string;
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
      missions: {
        Row: Mission;
        Insert: Mission;
        Update: Partial<Mission>;
        Relationships: [];
      };
      user_missions: {
        Row: UserMission;
        Insert: UserMission;
        Update: Partial<UserMission>;
        Relationships: [];
      };
      badges: {
        Row: Badge;
        Insert: Badge;
        Update: Partial<Badge>;
        Relationships: [];
      };
      user_badges: {
        Row: UserBadge;
        Insert: UserBadge;
        Update: Partial<UserBadge>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: {
          user_id: string;
          body: string;
          category?: string;
          image_url?: string | null;
          capture_id?: string | null;
          lat?: number | null;
          lng?: number | null;
          likes_count?: number;
          comments_count?: number;
          id?: string;
          created_at?: string;
        };
        Update: Partial<Post>;
        Relationships: [];
      };
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string; created_at?: string };
        Update: Partial<{ created_at: string }>;
        Relationships: [];
      };
      post_comments: {
        Row: { id: string; post_id: string; user_id: string; body: string; created_at: string };
        Insert: { post_id: string; user_id: string; body: string; id?: string; created_at?: string };
        Update: Partial<{ body: string }>;
        Relationships: [];
      };
      rescue_alerts: {
        Row: RescueAlert;
        Insert: {
          user_id: string;
          title: string;
          body?: string | null;
          lat?: number | null;
          lng?: number | null;
          urgent?: boolean;
          resolved?: boolean;
          resolved_by?: string | null;
          resolved_at?: string | null;
          id?: string;
          created_at?: string;
        };
        Update: Partial<RescueAlert>;
        Relationships: [];
      };
      user_shelter_visits: {
        Row: UserShelterVisit;
        Insert: {
          user_id: string;
          osm_id: string;
          lat: number;
          lng: number;
          name?: string | null;
          visited_at?: string;
        };
        Update: Partial<UserShelterVisit>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<{ body: string }>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
