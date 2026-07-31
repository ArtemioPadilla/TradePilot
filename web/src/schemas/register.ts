/**
 * Registration schema — Spec-DD layer (docs/PRINCIPLES.md §3).
 * Password bounds follow Supabase/bcrypt limits (8–72 chars).
 */
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Please tell us your name.').max(80),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be at most 72 characters.'),
});

/** Derived type. Never authored alongside the schema. */
export type RegisterValues = z.infer<typeof RegisterSchema>;
