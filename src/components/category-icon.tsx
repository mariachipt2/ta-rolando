import {
  Music2,
  PartyPopper,
  Wine,
  Utensils,
  Theater,
  Clapperboard,
  Trophy,
  Baby,
  Store,
  Church,
  GraduationCap,
  Users,
  Sparkles,
} from "lucide-react";
const icons = {
  Music2,
  PartyPopper,
  Wine,
  Utensils,
  Theater,
  Clapperboard,
  Trophy,
  Baby,
  Store,
  Church,
  GraduationCap,
  Users,
  Sparkles,
};
export function CategoryIcon({ name }: { name: string }) {
  const Icon = icons[name as keyof typeof icons] || Sparkles;
  return <Icon size={20} />;
}
