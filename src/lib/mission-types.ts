export type Mission = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  target_count: number;
  metric_type: string;
};

export type UserMission = Mission & {
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

export type UserBadge = Badge & {
  level: number;
  xp: number;
};

export type MetricSnapshot = {
  capture_count: number;
  geotagged_visits: number;
  unique_cities: number;
  unique_countries: number;
  rare_catches: number;
  shelter_visits: number;
  verify_rescue: number;
};
