"use client";

import {
  LayoutGrid,
  Heart,
  Brain,
  Baby,
  Bone,
  Stethoscope,
  Eye,
  Ear,
  Smile,
  Activity,
  Pill,
  Sparkles,
  ShieldCheck,
  Microscope,
  type LucideIcon,
} from "lucide-react";

export const ALL_SPECIALTIES = "all";

/**
 * Visual descriptor for one chip in the specialty filter bar.
 *
 * `count` is optional because the chip row also has to render correctly
 * when the doctor list hasn't loaded yet (server-rendered SSR, slow API).
 */
export interface SpecialtyChip {
  name: string;
  count?: number;
}

interface SpecialtyFilterBarProps {
  /** List of specialties to render (excluding the leading "All" pill). */
  specialties: SpecialtyChip[];
  /** Currently selected specialty name, or `ALL_SPECIALTIES` for unfiltered. */
  selectedSpecialty: string;
  onSelect: (specialty: string) => void;
  /** Total doctor count, used on the "All" chip. */
  totalCount?: number;
  className?: string;
}

/**
 * Tone palette used to colour each specialty card. Kept small and
 * deterministic so a given specialty always gets the same colour across
 * pages — pure function of the name.
 */
const TONES = [
  { wrap: "bg-rose-50 dark:bg-rose-500/10", icon: "text-rose-600 dark:text-rose-400", ring: "ring-rose-500 dark:ring-rose-400" },
  { wrap: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500 dark:ring-blue-400" },
  { wrap: "bg-amber-50 dark:bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500 dark:ring-amber-400" },
  { wrap: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500 dark:ring-emerald-400" },
  { wrap: "bg-purple-50 dark:bg-purple-500/10", icon: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500 dark:ring-purple-400" },
  { wrap: "bg-cyan-50 dark:bg-cyan-500/10", icon: "text-cyan-600 dark:text-cyan-400", ring: "ring-cyan-500 dark:ring-cyan-400" },
  { wrap: "bg-indigo-50 dark:bg-indigo-500/10", icon: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500 dark:ring-indigo-400" },
  { wrap: "bg-pink-50 dark:bg-pink-500/10", icon: "text-pink-600 dark:text-pink-400", ring: "ring-pink-500 dark:ring-pink-400" },
];

/**
 * Known specialty → icon + tone mapping. Anything not in this map falls
 * back to a generic stethoscope with a deterministic tone — meaning new
 * specialties added by hospitals in the future render gracefully without
 * any UI change required.
 */
const KNOWN_SPECIALTIES: Record<string, { icon: LucideIcon; toneIndex: number }> = {
  Cardiology: { icon: Heart, toneIndex: 0 },
  Neurology: { icon: Brain, toneIndex: 4 },
  Pediatrics: { icon: Baby, toneIndex: 1 },
  Orthopedics: { icon: Bone, toneIndex: 2 },
  General: { icon: Stethoscope, toneIndex: 3 },
  Ophthalmology: { icon: Eye, toneIndex: 5 },
  ENT: { icon: Ear, toneIndex: 6 },
  Dentistry: { icon: Smile, toneIndex: 1 },
  Dermatology: { icon: Sparkles, toneIndex: 7 },
  Oncology: { icon: ShieldCheck, toneIndex: 2 },
  Psychiatry: { icon: Brain, toneIndex: 4 },
  Radiology: { icon: Activity, toneIndex: 5 },
  Gastroenterology: { icon: Pill, toneIndex: 3 },
  Pathology: { icon: Microscope, toneIndex: 6 },
};

/** Stable hash so unknown specialties still get a consistent tone. */
function hashTone(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % TONES.length;
}

function descriptor(name: string) {
  const known = KNOWN_SPECIALTIES[name];
  const tone = known ? TONES[known.toneIndex] : TONES[hashTone(name)];
  const Icon = known ? known.icon : Stethoscope;
  return { Icon, tone };
}

/**
 * Horizontally-scrollable row of specialty chips, rendered above the
 * doctor list on the Book page. Tap a chip → filter the list.
 *
 * Designed to be drop-in across both `flat` (all doctors) and
 * `hierarchy` (after picking a department) views — controlled component
 * with no internal data fetching.
 */
export function SpecialtyFilterBar({
  specialties,
  selectedSpecialty,
  onSelect,
  totalCount,
  className = "",
}: SpecialtyFilterBarProps) {
  return (
    // Extra vertical padding (`py-2`) and matching negative margin
    // (`-my-1`) so the active chip's `ring-offset` has room to render —
    // without it the ring is clipped by `overflow-x-auto` (which also
    // clips the y-axis) and ends up looking cut off at the top.
    <div className={`flex gap-2.5 overflow-x-auto scrollbar-hide py-2 -my-1 -mx-1 px-1 ${className}`}>
      {/* "All" chip — clears the filter. */}
      <SpecialtyChipButton
        active={selectedSpecialty === ALL_SPECIALTIES}
        onClick={() => onSelect(ALL_SPECIALTIES)}
        label="All"
        count={totalCount}
        Icon={LayoutGrid}
        toneWrap="bg-teal-50 dark:bg-emerald-500/10"
        toneIcon="text-teal-600 dark:text-emerald-400"
        toneRing="ring-teal-500 dark:ring-emerald-400"
      />

      {specialties.map((s) => {
        const { Icon, tone } = descriptor(s.name);
        return (
          <SpecialtyChipButton
            key={s.name}
            active={selectedSpecialty === s.name}
            onClick={() => onSelect(s.name)}
            label={s.name}
            count={s.count}
            Icon={Icon}
            toneWrap={tone.wrap}
            toneIcon={tone.icon}
            toneRing={tone.ring}
          />
        );
      })}
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  Icon: LucideIcon;
  toneWrap: string;
  toneIcon: string;
  toneRing: string;
}

function SpecialtyChipButton({
  active,
  onClick,
  label,
  count,
  Icon,
  toneWrap,
  toneIcon,
  toneRing,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full border transition-all active:scale-[0.97] ${
        active
          ? `bg-white dark:bg-[#1A2332] border-transparent shadow-sm ring-2 ${toneRing} ring-offset-1 ring-offset-gray-50 dark:ring-offset-[#0B0F14]`
          : "bg-white dark:bg-[#1A2332] border-gray-100 dark:border-[#2A3A4E] hover:border-gray-200 dark:hover:border-[#3A4A5E]"
      }`}
    >
      <span className={`w-7 h-7 rounded-full flex items-center justify-center ${toneWrap}`}>
        <Icon className={`w-3.5 h-3.5 ${toneIcon}`} />
      </span>
      <span className={`text-xs font-semibold whitespace-nowrap ${active ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-[#CBD5E1]"}`}>
        {label}
      </span>
      {typeof count === "number" && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            active
              ? "bg-gray-900/10 dark:bg-white/10 text-gray-700 dark:text-white"
              : "bg-gray-100 dark:bg-[#223040] text-gray-500 dark:text-[#94A3B8]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
