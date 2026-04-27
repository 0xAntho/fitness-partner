import { z } from "zod";

// ─── Workout Plan ────────────────────────────────────────────────────────────

export const ExerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int(),
  reps: z.union([z.number().int(), z.string()]),
  rest_seconds: z.number().int(),
  notes: z.string().optional(),
});

export const WorkoutDaySchema = z.object({
  day: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  focus: z.string(),
  exercises: z.array(ExerciseSchema),
});

export const WorkoutPlanSchema = z.object({
  week_label: z.string(),
  days: z.array(WorkoutDaySchema),
  weekly_notes: z.string(),
});

export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

// ─── Coach Review ────────────────────────────────────────────────────────────

export const CoachSuggestionSchema = z.object({
  category: z.enum(["exercise", "recovery", "nutrition", "intensity"]),
  suggestion: z.string(),
  rationale: z.string(),
});

export const CoachReviewSchema = z.object({
  summary_markdown: z.string(),
  suggestions: z.array(CoachSuggestionSchema),
});

export type CoachReview = z.infer<typeof CoachReviewSchema>;
