import {
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTY_OPTIONS,
} from "@/lib/constants";

export function getDifficultyOption(id) {
  return (
    DIFFICULTY_OPTIONS.find((option) => option.id === id) ||
    DIFFICULTY_OPTIONS.find((option) => option.id === DEFAULT_DIFFICULTY_ID)
  );
}
