import { z } from 'zod';

/**
 * The brief's form rules. Mirrors backend/src/common/validation.ts (same
 * limits, same messages); the API re-checks everything regardless.
 */
export const RULES = {
  name: { min: 20, max: 60 },
  address: { max: 400 },
  password: { min: 8, max: 16 },
  email: { max: 254 },
} as const;

export const UPPERCASE = /\p{Lu}/u;
export const SPECIAL_CHAR = /[^\p{L}\p{N}\s]/u;

const nameMessage = `Name must be ${RULES.name.min}–${RULES.name.max} characters`;
const passwordLengthMessage = `Password must be ${RULES.password.min}–${RULES.password.max} characters`;

export const nameField = z.string().trim().min(RULES.name.min, nameMessage).max(RULES.name.max, nameMessage);

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(RULES.email.max, 'Email is too long')
  .pipe(z.email('Email must be a valid email address'));

export const addressField = z
  .string()
  .trim()
  .min(1, 'Address is required')
  .max(RULES.address.max, `Address must be at most ${RULES.address.max} characters`);

export const passwordField = z
  .string()
  .min(RULES.password.min, passwordLengthMessage)
  .max(RULES.password.max, passwordLengthMessage)
  .regex(UPPERCASE, 'Password must include an uppercase letter')
  .regex(SPECIAL_CHAR, 'Password must include a special character');

/** Live checklist shown under password inputs. */
export function passwordChecks(password: string) {
  return [
    {
      label: `${RULES.password.min}–${RULES.password.max} characters`,
      met: password.length >= RULES.password.min && password.length <= RULES.password.max,
    },
    { label: 'An uppercase letter', met: UPPERCASE.test(password) },
    { label: 'A special character', met: SPECIAL_CHAR.test(password) },
  ];
}

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  address: addressField,
  password: passwordField,
});

export const roles = ['USER', 'ADMIN', 'STORE_OWNER'] as const;

export const createUserSchema = signupSchema.extend({
  role: z.enum(roles, 'Choose a role'),
});

export const createStoreSchema = z.object({
  name: nameField,
  email: emailField,
  address: addressField,
  /** The <select> value; sent as a number. */
  ownerId: z.string().min(1, 'Choose a store owner'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
