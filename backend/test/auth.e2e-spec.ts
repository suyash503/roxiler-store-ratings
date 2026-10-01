import request from 'supertest';
import { Role } from '../src/generated/prisma/enums';
import { createTestApp, createUser, loginAs, PASSWORD, resetDatabase, TestContext, validName } from './helpers';

describe('Auth', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetDatabase(ctx.prisma));
  afterAll(() => ctx.app.close());

  const signupBody = () => ({
    name: validName('Signup'),
    email: 'New.Person@Example.com',
    address: '221B Baker Street, London',
    password: 'Valid@Pass1',
  });

  describe('POST /api/auth/signup', () => {
    it('creates a normal user, normalises the email and starts a session', async () => {
      const agent = request.agent(ctx.app.getHttpServer());
      const res = await agent.post('/api/auth/signup').send(signupBody()).expect(201);

      expect(res.body).toMatchObject({ email: 'new.person@example.com', role: Role.USER });
      expect(res.body).not.toHaveProperty('passwordHash');
      const cookie = String(res.headers['set-cookie']);
      expect(cookie).toMatch(/access_token=.+; Max-Age=\d+;.*HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);

      await agent.get('/api/auth/me').expect(200);
    });

    it('rejects an attempt to choose a role', async () => {
      const res = await ctx.http()
        .post('/api/auth/signup')
        .send({ ...signupBody(), role: Role.ADMIN })
        .expect(400);
      expect(res.body.message).toContain('property role should not exist');
      expect(await ctx.prisma.user.count()).toBe(0);
    });

    it('reports every broken form rule at once', async () => {
      const res = await ctx.http()
        .post('/api/auth/signup')
        .send({ name: 'Too short', email: 'not-an-email', address: ' ', password: 'lowercase1' })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'Name must be 20–60 characters',
          'Email must be a valid email address',
          'Address is required',
          'Password must include an uppercase letter',
          'Password must include a special character',
        ]),
      );
    });

    it('treats emails case-insensitively when checking for duplicates', async () => {
      await ctx.http().post('/api/auth/signup').send(signupBody()).expect(201);
      const res = await ctx.http()
        .post('/api/auth/signup')
        .send({ ...signupBody(), email: 'NEW.PERSON@example.com' })
        .expect(409);
      expect(res.body.message).toBe('An account with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it.each([Role.ADMIN, Role.USER, Role.STORE_OWNER])('logs in a %s through the same endpoint', async (role) => {
      const user = await createUser(ctx.prisma, { role });
      const res = await ctx.http()
        .post('/api/auth/login')
        .send({ email: `  ${user.email.toUpperCase()} `, password: PASSWORD })
        .expect(200);
      expect(res.body).toMatchObject({ id: user.id, role });
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
      const user = await createUser(ctx.prisma);
      const wrongPassword = await ctx.http()
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Wrong@Pass1' })
        .expect(401);
      const unknownEmail = await ctx.http()
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD })
        .expect(401);
      expect(wrongPassword.body.message).toBe('Invalid email or password');
      expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
    });
  });

  describe('sessions', () => {
    it('rejects requests without a session, and tampered tokens', async () => {
      await ctx.http().get('/api/auth/me').expect(401);
      await ctx.http().get('/api/auth/me').set('Cookie', 'access_token=not.a.jwt').expect(401);
    });

    it('accepts a Bearer token for API clients', async () => {
      const user = await createUser(ctx.prisma);
      const login = await ctx.http().post('/api/auth/login').send({ email: user.email, password: PASSWORD });
      const token = /access_token=([^;]+)/.exec(String(login.headers['set-cookie']))![1];
      await ctx.http().get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('logout clears the cookie', async () => {
      const user = await createUser(ctx.prisma);
      const agent = await loginAs(ctx, user.email);
      await agent.post('/api/auth/logout').expect(204);
      await agent.get('/api/auth/me').expect(401);
    });
  });

  describe('PATCH /api/auth/password', () => {
    it('changes the password, keeps this session and ends the others', async () => {
      const user = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const thisDevice = await loginAs(ctx, user.email);
      const otherDevice = await loginAs(ctx, user.email);

      await thisDevice
        .patch('/api/auth/password')
        .send({ currentPassword: PASSWORD, newPassword: 'Brand#New9' })
        .expect(200);

      await thisDevice.get('/api/auth/me').expect(200);
      await otherDevice.get('/api/auth/me').expect(401);
      await ctx.http().post('/api/auth/login').send({ email: user.email, password: PASSWORD }).expect(401);
      await ctx.http().post('/api/auth/login').send({ email: user.email, password: 'Brand#New9' }).expect(200);
    });

    it('requires the correct current password', async () => {
      const user = await createUser(ctx.prisma);
      const agent = await loginAs(ctx, user.email);
      const res = await agent
        .patch('/api/auth/password')
        .send({ currentPassword: 'Wrong@Pass1', newPassword: 'Brand#New9' })
        .expect(400);
      expect(res.body.message).toBe('Current password is incorrect');
    });

    it('applies the password rules to the new password and refuses reuse', async () => {
      const user = await createUser(ctx.prisma);
      const agent = await loginAs(ctx, user.email);
      await agent
        .patch('/api/auth/password')
        .send({ currentPassword: PASSWORD, newPassword: 'short' })
        .expect(400);
      const res = await agent
        .patch('/api/auth/password')
        .send({ currentPassword: PASSWORD, newPassword: PASSWORD })
        .expect(400);
      expect(res.body.message).toBe('New password must be different from the current one');
    });
  });
});
