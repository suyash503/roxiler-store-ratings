import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignupDto } from '../auth/auth.dto';

async function errorsFor(input: Partial<Record<keyof SignupDto, unknown>>) {
  const dto = plainToInstance(SignupDto, {
    name: 'A perfectly valid name',
    email: 'valid@example.com',
    address: 'Somewhere nice',
    password: 'Valid@Pass1',
    ...input,
  });
  const errors = await validate(dto);
  return Object.fromEntries(errors.map((e) => [e.property, Object.values(e.constraints ?? {})]));
}

describe('form rules', () => {
  it('accepts a valid form', async () => {
    expect(await errorsFor({})).toEqual({});
  });

  describe('name: 20–60 characters after trimming', () => {
    it.each([
      ['x'.repeat(19), false],
      ['x'.repeat(20), true],
      ['x'.repeat(60), true],
      ['x'.repeat(61), false],
      [`  ${'x'.repeat(19)}  `, false],
    ])('%p → valid: %p', async (name, valid) => {
      expect('name' in (await errorsFor({ name }))).toBe(!valid);
    });
  });

  describe('address: required, at most 400 characters', () => {
    it.each([
      ['', false],
      ['   ', false],
      ['x'.repeat(400), true],
      ['x'.repeat(401), false],
    ])('%p → valid: %p', async (address, valid) => {
      expect('address' in (await errorsFor({ address }))).toBe(!valid);
    });
  });

  describe('password: 8–16 chars, an uppercase letter and a special character', () => {
    it.each([
      ['Abcdef!', false], // 7
      ['Abcdef!1', true], // 8
      ['Abcdefghijklmn!1', true], // 16
      ['Abcdefghijklmno!1', false], // 17
      ['abcdefg!1', false], // no uppercase
      ['Abcdefgh1', false], // no special
      ['Abcdefg 1', false], // a space isn't a special character
      ['Äbcdefg!1', true], // accented capitals count
      ['äbcdefg!1', false], // no uppercase at all
      ['Abcdéfgh1', false], // an accented letter isn't a special character
    ])('%p → valid: %p', async (password, valid) => {
      expect('password' in (await errorsFor({ password }))).toBe(!valid);
    });

    it('reports every rule the password breaks', async () => {
      expect((await errorsFor({ password: 'short' })).password).toEqual(
        expect.arrayContaining([
          'Password must be 8–16 characters',
          'Password must include an uppercase letter',
          'Password must include a special character',
        ]),
      );
    });
  });

  describe('email', () => {
    it.each([
      ['person@example.com', true],
      ['  Person@Example.COM ', true],
      ['person@', false],
      ['person.example.com', false],
      ['person@example', false],
    ])('%p → valid: %p', async (email, valid) => {
      expect('email' in (await errorsFor({ email }))).toBe(!valid);
    });

    it('is trimmed and lower-cased', () => {
      const dto = plainToInstance(SignupDto, { email: '  Person@Example.COM ' });
      expect(dto.email).toBe('person@example.com');
    });
  });
});
