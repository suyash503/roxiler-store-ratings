import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, MaxLength, ValidateBy } from 'class-validator';

/**
 * Form rules from the brief. The frontend mirrors these in
 * frontend/src/lib/validation.ts and the database enforces them with CHECKs.
 */
export const RULES = {
  name: { min: 20, max: 60 },
  address: { max: 400 },
  password: { min: 8, max: 16 },
  email: { max: 254 },
} as const;

/** "Special character": anything that isn't a letter, digit or whitespace (any script). */
export const SPECIAL_CHAR = /[^\p{L}\p{N}\s]/u;
/** Any uppercase letter, including accented ones such as "Ä". */
export const UPPERCASE = /\p{Lu}/u;

const trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

export const IsValidName = () =>
  applyDecorators(
    trim(),
    IsString(),
    Length(RULES.name.min, RULES.name.max, {
      message: `Name must be ${RULES.name.min}–${RULES.name.max} characters`,
    }),
  );

export const IsValidAddress = () =>
  applyDecorators(
    trim(),
    IsString(),
    IsNotEmpty({ message: 'Address is required' }),
    MaxLength(RULES.address.max, {
      message: `Address must be at most ${RULES.address.max} characters`,
    }),
  );

export const IsValidEmail = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    ),
    IsString(),
    MaxLength(RULES.email.max),
    IsEmail({}, { message: 'Email must be a valid email address' }),
  );

/**
 * Like @Matches, but with its own name. class-validator keys errors by rule
 * name, so two @Matches on one field would hide one of the messages.
 */
const Contains = (name: string, pattern: RegExp, message: string) =>
  ValidateBy({
    name,
    validator: {
      validate: (value: unknown) => typeof value === 'string' && pattern.test(value),
      defaultMessage: () => message,
    },
  });

/** Not trimmed: spaces in a password are the user's choice. */
export const IsValidPassword = () =>
  applyDecorators(
    IsString(),
    Length(RULES.password.min, RULES.password.max, {
      message: `Password must be ${RULES.password.min}–${RULES.password.max} characters`,
    }),
    Contains('hasUppercase', UPPERCASE, 'Password must include an uppercase letter'),
    Contains('hasSpecialChar', SPECIAL_CHAR, 'Password must include a special character'),
  );
