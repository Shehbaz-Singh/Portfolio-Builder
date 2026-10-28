import { z } from 'zod';
import { DELETE_CONFIRMATION } from './legal';
import { profileSchema } from './portfolio';

// bcrypt only uses the first 72 bytes of a password, so reject anything longer instead of
// silently truncating it.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((p) => new TextEncoder().encode(p).length <= 72, 'Password must be at most 72 bytes');

const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  // Optional: defaults to the part of the email before the @.
  fullName: z.string().trim().min(1).max(100).optional(),
  // Must be true: the box on the sign-up form. The API records when and which version.
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Please agree to the Terms and Privacy Policy to continue' }),
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // No strength rules on login, so changing the policy never locks existing users out.
  password: z.string().min(1, 'Password is required').max(1024),
});
export type LoginInput = z.infer<typeof loginSchema>;

// POST /auth/change-password
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(1024),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'Choose a password you have not used just now',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// DELETE /auth/me: the password and the typed word are the confirmation, so neither a stolen session
// nor a stray click can do it.
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required').max(1024),
  confirmation: z
    .string()
    .trim()
    .refine(
      (v) => v === DELETE_CONFIRMATION,
      `Type ${DELETE_CONFIRMATION} in capital letters to confirm`,
    ),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// ---- Responses ----

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const sessionResponseSchema = z.object({
  user: authUserSchema,
  profile: profileSchema.nullable(),
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const authResponseSchema = sessionResponseSchema.extend({
  token: z.string(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
