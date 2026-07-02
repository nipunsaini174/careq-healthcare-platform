"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { addPerson, updatePerson, getRelationships, type ManagedPerson } from "@/lib/people";

interface AddPersonSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: (person: ManagedPerson) => void;
  /** Pass a person to edit; omit to add a new one. */
  editing?: ManagedPerson | null;
}

export function AddPersonSheet({ open, onClose, onSaved, editing }: AddPersonSheetProps) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Father");
  const [customRelationship, setCustomRelationship] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [relationships, setRelationships] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const rels = getRelationships();
    setRelationships(rels);
    if (editing) {
      setName(editing.name);
      setAge(editing.age || "");
      setGender(editing.gender || "Male");
      // If the editing relationship isn't a known chip, treat it as custom.
      if (rels.some((r) => r.toLowerCase() === editing.relationship.toLowerCase())) {
        setRelationship(editing.relationship);
        setCustomRelationship("");
      } else {
        setRelationship("Other");
        setCustomRelationship(editing.relationship);
      }
    } else {
      setName("");
      setRelationship("Father");
      setCustomRelationship("");
      setAge("");
      setGender("Male");
    }
    setError("");
  }, [open, editing]);

  const handleSave = () => {
    const finalRel = relationship === "Other" ? customRelationship.trim() : relationship;
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    if (!finalRel) {
      setError("Please specify the relationship");
      return;
    }

    const saved = editing
      ? updatePerson(editing.id, { name: name.trim(), relationship: finalRel, age, gender })
      : addPerson({ name: name.trim(), relationship: finalRel, age, gender });

    if (saved) onSaved(saved);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed z-[210] bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-white dark:bg-[#111820] rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#2A3A4E] shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editing ? "Edit Person" : "Add Person"}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#1A2332] text-gray-500 dark:text-[#94A3B8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                    placeholder="Years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                >
                  {relationships.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              {relationship === "Other" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Specify Relationship</label>
                  <input
                    type="text"
                    value={customRelationship}
                    onChange={(e) => setCustomRelationship(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                    placeholder="e.g. Uncle, Friend, Guardian"
                  />
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-[#2A3A4E] shrink-0">
              <button
                onClick={handleSave}
                className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:bg-[#4bc29a] dark:hover:bg-emerald-500 transition-colors"
              >
                {editing ? "Save Changes" : "Add Person"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
