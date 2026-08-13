"use client";

import { Users, Plus } from "lucide-react";
import { PersonAvatar } from "./PersonAvatar";
import type { ManagedPerson } from "@/lib/people";

export const ALL_PEOPLE = "all";

interface PeopleFilterBarProps {
  people: ManagedPerson[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Show a trailing "Add" button. */
  onAdd?: () => void;
  className?: string;
}

/**
 * Google-Photos-style horizontal "people" filter. Renders an "All" chip
 * followed by an avatar chip per managed person, plus an optional add button.
 */
export function PeopleFilterBar({ people, selectedId, onSelect, onAdd, className = "" }: PeopleFilterBarProps) {
  return (
    <div className={`flex gap-3 overflow-x-auto scrollbar-hide pb-1 ${className}`}>
      {/* All */}
      <button
        onClick={() => onSelect(ALL_PEOPLE)}
        className="flex flex-col items-center gap-1.5 shrink-0 w-16"
      >
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            selectedId === ALL_PEOPLE
              ? "bg-teal-500 dark:bg-primary text-white dark:text-background ring-2 ring-offset-2 ring-teal-500 dark:ring-primary ring-offset-white dark:ring-offset-background"
              : "bg-gray-100 dark:bg-card text-gray-500 dark:text-muted-foreground"
          }`}
        >
          <Users className="w-5 h-5" />
        </div>
        <span
          className={`text-[11px] font-medium truncate w-full text-center ${
            selectedId === ALL_PEOPLE ? "text-teal-600 dark:text-primary" : "text-gray-500 dark:text-muted-foreground"
          }`}
        >
          All
        </span>
      </button>

      {people.map((person) => {
        const active = selectedId === person.id;
        return (
          <button
            key={person.id}
            onClick={() => onSelect(person.id)}
            className="flex flex-col items-center gap-1.5 shrink-0 w-16"
            title={`${person.name} (${person.relationship})`}
          >
            <PersonAvatar person={person} size={44} ring={active} />
            <span
              className={`text-[11px] font-medium truncate w-full text-center ${
                active ? "text-teal-600 dark:text-primary" : "text-gray-600 dark:text-muted-foreground"
              }`}
            >
              {person.isSelf ? "You" : person.name.split(" ")[0]}
            </span>
          </button>
        );
      })}

      {onAdd && (
        <button onClick={onAdd} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
          <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 dark:border-[#2A3A4E] flex items-center justify-center text-gray-400 dark:text-[#64748B] hover:border-teal-500 hover:text-teal-500 dark:hover:border-primary dark:hover:text-primary transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-muted-foreground">Add</span>
        </button>
      )}
    </div>
  );
}
