import {
  Activity,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Medal,
  Mountain,
  Music,
  PersonStanding,
  Target,
  Timer,
  Trophy,
  Volleyball,
  Waves,
  Zap,
} from 'lucide-react';

type IconComponent = typeof Dumbbell;

const ICONS: Record<string, IconComponent> = {
  activity: Activity,
  bike: Bike,
  dumbbell: Dumbbell,
  flame: Flame,
  footprints: Footprints,
  'heart-pulse': HeartPulse,
  medal: Medal,
  mountain: Mountain,
  music: Music,
  'person-standing': PersonStanding,
  target: Target,
  timer: Timer,
  trophy: Trophy,
  volleyball: Volleyball,
  waves: Waves,
  zap: Zap,
};

const FALLBACK: IconComponent = Dumbbell;

export function isKnownIcon(name: string): boolean {
  return name in ICONS;
}

interface CategoryIconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function CategoryIcon({ name, size = 16, strokeWidth = 2, className }: CategoryIconProps) {
  const Icon = ICONS[name] ?? FALLBACK;

  if (process.env.NODE_ENV !== 'production' && !ICONS[name]) {
    // rozjazd między zestawem w bazie a zainstalowaną wersją biblioteki
    console.warn(`[CategoryIcon] Nieznana nazwa ikony: "${name}" — użyto ikony awaryjnej`);
  }

  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" focusable="false" />;
}

export default CategoryIcon;
