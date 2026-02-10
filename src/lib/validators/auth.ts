import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
});

export const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(10).max(128),
});
