export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type CatTraits = {
  chonk: number;
  shy: number;
  grumpy: number;
  floof: number;
};

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  streak_count: number;
  last_capture_date: string | null;
  daily_goal: number;
  accepted_terms_at: string | null;
  onboarding_complete: boolean;
  community_guidelines_at: string | null;
  community_banned_until: string | null;
  is_super_admin: boolean;
  created_at: string;
};

export type StrayCat = {
  id: string;
  canonical_name: string | null;
  name_locked_at: string | null;
  primary_lat: number | null;
  primary_lng: number | null;
  place_label: string | null;
  sighting_count: number;
  cover_sticker_url: string | null;
  image_embedding: number[] | null;
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
  place_label: string | null;
  coat_type: string | null;
  rarity: Rarity | null;
  nickname: string | null;
  caught_at: string;
  stray_cat_id: string | null;
  share_photo: boolean;
  share_location: boolean;
  short_description: string | null;
  traits: CatTraits | null;
  image_embedding: number[] | null;
  name_locked_at: string | null;
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
  place_label?: string | null;
  coat_type?: string | null;
  rarity?: Rarity | null;
  nickname?: string | null;
  caught_at?: string;
  stray_cat_id?: string | null;
  share_photo?: boolean;
  share_location?: boolean;
  short_description?: string | null;
  traits?: CatTraits | null;
  image_embedding?: number[] | null;
  name_locked_at?: string | null;
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
  hidden_at: string | null;
  hidden_reason: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  channel: string;
  user_id: string;
  body: string;
  hidden_at: string | null;
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

export type NamePoll = {
  id: string;
  capture_id: string;
  user_id: string;
  option_a: string;
  option_b: string;
  closed_at: string | null;
  created_at: string;
};

export type NamePollVote = {
  poll_id: string;
  user_id: string;
  choice: "a" | "b";
  created_at: string;
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
      stray_cats: {
        Row: StrayCat;
        Insert: {
          id?: string;
          canonical_name?: string | null;
          name_locked_at?: string | null;
          primary_lat?: number | null;
          primary_lng?: number | null;
          place_label?: string | null;
          sighting_count?: number;
          cover_sticker_url?: string | null;
          image_embedding?: number[] | null;
          created_at?: string;
        };
        Update: Partial<StrayCat>;
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
      name_polls: {
        Row: NamePoll;
        Insert: {
          capture_id: string;
          user_id: string;
          option_a: string;
          option_b: string;
          id?: string;
          created_at?: string;
        };
        Update: Partial<Pick<NamePoll, "option_a" | "option_b" | "closed_at">>;
        Relationships: [];
      };
      name_poll_votes: {
        Row: NamePollVote;
        Insert: {
          poll_id: string;
          user_id: string;
          choice: "a" | "b";
          created_at?: string;
        };
        Update: Partial<{ choice: "a" | "b" }>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, "id" | "created_at" | "hidden_at"> & {
          id?: string;
          created_at?: string;
          hidden_at?: string | null;
        };
        Update: Partial<{ body: string; hidden_at: string | null }>;
        Relationships: [];
      };
      content_reports: {
        Row: {
          id: string;
          reporter_id: string;
          content_type: string;
          content_id: string;
          reported_user_id: string | null;
          reason: string;
          details: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          content_type: string;
          content_id: string;
          reported_user_id?: string | null;
          reason: string;
          details?: string | null;
          status?: string;
          id?: string;
          created_at?: string;
        };
        Update: Partial<{ status: string }>;
        Relationships: [];
      };
      user_blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string; created_at?: string };
        Update: Partial<{ created_at: string }>;
        Relationships: [];
      };
      rate_limit_events: {
        Row: { id: string; user_id: string; action: string; created_at: string };
        Insert: {
          user_id: string;
          action: string;
          id?: string;
          created_at?: string;
        };
        Update: Partial<{ created_at: string }>;
        Relationships: [];
      };
      user_cat_favorites: {
        Row: { user_id: string; capture_id: string; created_at: string };
        Insert: { user_id: string; capture_id: string; created_at?: string };
        Update: Partial<{ created_at: string }>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
