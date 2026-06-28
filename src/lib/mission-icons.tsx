import {
  Camera,
  Check,
  Compass,
  HandHeart,
  Heart,
  Home,
  MapPin,
  Sparkles,
  Trophy,
  Vote,
  type LucideIcon,
} from "lucide-react";

const MISSION_ICONS: Record<string, LucideIcon> = {
  report_sightings: Camera,
  photograph_five: Camera,
  visit_locations: MapPin,
  visit_shelter: Home,
  two_cities: Compass,
  rare_hunter: Sparkles,
  verify_rescue: Check,
  vote_names: Vote,
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  explorer: Compass,
  photographer: Camera,
  rescuer: HandHeart,
  cat_lover: Heart,
  historian: Trophy,
  shelter_hero: Home,
  community_helper: HandHeart,
};

export function MissionIcon({
  missionId,
  className,
}: {
  missionId: string;
  className?: string;
}) {
  const Icon = MISSION_ICONS[missionId] ?? Trophy;
  return <Icon className={className} strokeWidth={2} />;
}

export function BadgeIcon({
  badgeId,
  className,
}: {
  badgeId: string;
  className?: string;
}) {
  const Icon = BADGE_ICONS[badgeId] ?? Trophy;
  return <Icon className={className} strokeWidth={2} />;
}
