import { describe, expect, it } from 'vitest';
import { changePasswordSchema, createStoreSchema, passwordChecks, signupSchema } from './validation';

const valid = {
  name: 'A perfectly valid name',
  email: 'valid@example.com',
  address: 'Somewhere nice',
  password: 'Valid@Pass1',
};

function fieldErrors(input: Partial<typeof valid>) {
  const result = signupSchema.safeParse({ ...valid, ...input });
  return result.success ? {} : result.error.flatten().fieldErrors;
}

// Same edge cases as backend/src/common/validation.spec.ts, so the two can't drift apart silently.
describe('form rules (mirror of the API)', () => {
  it('accepts a valid form and normalises the email', () => {
    const result = signupSchema.parse({ ...valid, email: '  Person@Example.COM ' });
    expect(result.email).toBe('person@example.com');
  });

  it.each([
    ['x'.repeat(19), false],
    ['x'.repeat(20), true],
    ['x'.repeat(60), true],
    ['x'.repeat(61), false],
    [`  ${'x'.repeat(19)}  `, false],
  ])('name %#: valid=%s', (name, ok) => {
    expect('name' in fieldErrors({ name })).toBe(!ok);
  });

  it.each([
    ['', false],
    ['   ', false],
    ['x'.repeat(400), true],
    ['x'.repeat(401), false],
  ])('address %#: valid=%s', (address, ok) => {
    expect('address' in fieldErrors({ address })).toBe(!ok);
  });

  it.each([
    ['Abcdef!', false],
    ['Abcdef!1', true],
    ['Abcdefghijklmn!1', true],
    ['Abcdefghijklmno!1', false],
    ['abcdefg!1', false],
    ['Abcdefgh1', false],
    ['Abcdefg 1', false],
    ['Äbcdefg!1', true],
    ['Abcdéfgh1', false],
  ])('password %s: valid=%s', (password, ok) => {
    expect('password' in fieldErrors({ password })).toBe(!ok);
  });

  it('uses the same messages as the API', () => {
    expect(fieldErrors({ name: 'short', address: '', password: 'short', email: 'nope' })).toEqual({
      name: ['Name must be 20–60 characters'],
      email: ['Email must be a valid email address'],
      address: ['Address is required'],
      password: [
        'Password must be 8–16 characters',
        'Password must include an uppercase letter',
        'Password must include a special character',
      ],
    });
  });

  it('applies the name rule to store names and requires an owner', () => {
    const result = createStoreSchema.safeParse({ name: 'Tiny Shop', email: 'a@b.co', address: 'x', ownerId: '' });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      name: ['Name must be 20–60 characters'],
      ownerId: ['Choose a store owner'],
    });
  });

  it('checks that the new password is confirmed and actually new', () => {
    const mismatch = changePasswordSchema.safeParse({ currentPassword: 'Old@Pass1', newPassword: 'New@Pass1', confirmPassword: 'New@Pass2' });
    expect(mismatch.error?.flatten().fieldErrors.confirmPassword).toEqual(['Passwords do not match']);

    const reused = changePasswordSchema.safeParse({ currentPassword: 'Same@Pass1', newPassword: 'Same@Pass1', confirmPassword: 'Same@Pass1' });
    expect(reused.error?.flatten().fieldErrors.newPassword).toEqual(['New password must be different from the current one']);
  });

  it('reports each password rule for the live checklist', () => {
    expect(passwordChecks('abc').map((c) => c.met)).toEqual([false, false, false]);
    expect(passwordChecks('Abcdefg!').map((c) => c.met)).toEqual([true, true, true]);
  });
});
