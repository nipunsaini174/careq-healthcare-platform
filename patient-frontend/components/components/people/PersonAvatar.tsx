"use client";

import { getColorForPerson, getInitials, type ManagedPerson } from "@/lib/people";

interface PersonAvatarProps {
  person: Pick<ManagedPerson, "name" | "colorIndex">;
  size?: number;
  className?: string;
  ring?: boolean;
}

export function PersonAvatar({ person, size = 44, className = "", ring = false }: PersonAvatarProps) {
  const color = getColorForPerson(person);
  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 ${
        ring ? "ring-2 ring-offset-2 ring-teal-500 dark:ring-primary ring-offset-white dark:ring-offset-background" : ""
      } ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
      }}
      aria-hidden="true"
    >
      {getInitials(person.name)}
    </div>
  );
}
