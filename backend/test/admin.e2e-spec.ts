import { Role } from '../src/generated/prisma/enums';
import {
  createStore,
  createTestApp,
  createUser,
  resetDatabase,
  signedIn,
  TestContext,
  validName,
} from './helpers';

describe('Admin', () => {
  let ctx: TestContext;
  let admin: Awaited<ReturnType<typeof signedIn>>['agent'];

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    ({ agent: admin } = await signedIn(ctx, Role.ADMIN));
  });
  afterAll(() => ctx.app.close());

  it.each([Role.USER, Role.STORE_OWNER])('is off-limits to a %s', async (role) => {
    const { agent } = await signedIn(ctx, role);
    await agent.get('/api/users').expect(403);
    await agent.get('/api/users/1').expect(403);
    await agent.post('/api/users').send({}).expect(403);
    await agent.get('/api/stats').expect(403);
    await agent.post('/api/stores').send({}).expect(403);
  });

  describe('GET /api/stats', () => {
    it('counts users, stores and ratings', async () => {
      const owner = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const store = await createStore(ctx.prisma, owner.id);
      const rater = await createUser(ctx.prisma);
      await ctx.prisma.rating.create({ data: { userId: rater.id, storeId: store.id, value: 4 } });

      const res = await admin.get('/api/stats').expect(200);
      expect(res.body).toEqual({ totalUsers: 3, totalStores: 1, totalRatings: 1 });
    });
  });

  describe('POST /api/users', () => {
    it.each([Role.ADMIN, Role.USER, Role.STORE_OWNER])('adds a %s', async (role) => {
      const res = await admin
        .post('/api/users')
        .send({ name: validName(), email: `${role}@Example.com`, password: 'Valid@Pass1', address: 'Somewhere 1', role })
        .expect(201);
      expect(res.body).toMatchObject({ role, email: `${role.toLowerCase()}@example.com` });
    });

    it('validates the form and requires a valid role', async () => {
      const res = await admin
        .post('/api/users')
        .send({ name: validName(), email: 'x@example.com', password: 'Valid@Pass1', address: 'a'.repeat(401), role: 'OWNER' })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining(['Address must be at most 400 characters', expect.stringMatching(/^Role must be one of/)]),
      );
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      await createUser(ctx.prisma, { name: 'Zara Khan Example User', email: 'zara@shop.example.com', address: 'Pune, Maharashtra' });
      await createUser(ctx.prisma, { name: 'aarav Patel Example User', email: 'aarav@mail.example.com', address: 'Delhi NCR', role: Role.STORE_OWNER });
      await createUser(ctx.prisma, { name: 'Meera Joshi 50% Discount', email: 'meera@mail.example.com', address: 'Mumbai, Maharashtra' });
    });

    it('filters by name, email and address (partial, case-insensitive) and role', async () => {
      const byName = await admin.get('/api/users?name=ZARA').expect(200);
      expect(byName.body.items.map((u: { name: string }) => u.name)).toEqual(['Zara Khan Example User']);

      const byEmail = await admin.get('/api/users?email=mail.example').expect(200);
      expect(byEmail.body.total).toBe(2);

      const byAddress = await admin.get('/api/users?address=maharashtra&role=USER').expect(200);
      expect(byAddress.body.total).toBe(2);

      const owners = await admin.get('/api/users?role=STORE_OWNER').expect(200);
      expect(owners.body.items).toHaveLength(1);
    });

    it('treats % and _ in a filter literally', async () => {
      // Unescaped, "%" and "_" would each match all 4 users.
      const percent = await admin.get('/api/users?name=%25').expect(200);
      expect(percent.body.items.map((u: { name: string }) => u.name)).toEqual(['Meera Joshi 50% Discount']);
      const underscore = await admin.get('/api/users?name=_').expect(200);
      expect(underscore.body.total).toBe(0);
    });

    it('sorts both ways, case-insensitively, and pages', async () => {
      // Names: "aarav …", "ADMIN Person …" (the signed-in admin), "Meera …", "Zara …".
      const firstWords = (body: { items: { name: string }[] }) => body.items.map((u) => u.name.split(' ')[0]);
      const asc = await admin.get('/api/users?sortBy=name&order=asc').expect(200);
      expect(firstWords(asc.body)).toEqual(['aarav', 'ADMIN', 'Meera', 'Zara']);
      const desc = await admin.get('/api/users?sortBy=name&order=desc').expect(200);
      expect(firstWords(desc.body)).toEqual(['Zara', 'Meera', 'ADMIN', 'aarav']);

      const page2 = await admin.get('/api/users?sortBy=email&order=desc&pageSize=2&page=2').expect(200);
      expect(page2.body).toMatchObject({ total: 4, page: 2, pageSize: 2 });
      expect(page2.body.items.map((u: { email: string }) => u.email)).toEqual([
        'meera@mail.example.com',
        'aarav@mail.example.com',
      ]);
    });

    it('rejects unknown sort fields and filters', async () => {
      await admin.get('/api/users?sortBy=passwordHash').expect(400);
      await admin.get('/api/users?password=x').expect(400);
      await admin.get('/api/users?pageSize=1000').expect(400);
    });

    it('lists only store owners without a store when withoutStore=true', async () => {
      const busy = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      await createStore(ctx.prisma, busy.id);
      const res = await admin.get('/api/users?withoutStore=true').expect(200);
      expect(res.body.items.map((u: { email: string }) => u.email)).toEqual(['aarav@mail.example.com']);
    });
  });

  describe('GET /api/users/:id', () => {
    it("includes a store owner's rating", async () => {
      const owner = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const store = await createStore(ctx.prisma, owner.id);
      for (const value of [4, 5]) {
        const rater = await createUser(ctx.prisma);
        await ctx.prisma.rating.create({ data: { userId: rater.id, storeId: store.id, value } });
      }

      const res = await admin.get(`/api/users/${owner.id}`).expect(200);
      expect(res.body).toMatchObject({
        id: owner.id,
        role: Role.STORE_OWNER,
        store: { id: store.id, name: store.name, averageRating: 4.5, ratingCount: 2 },
      });
    });

    it('shows store: null for an owner with no store, and no store key for others', async () => {
      const owner = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const user = await createUser(ctx.prisma);
      expect((await admin.get(`/api/users/${owner.id}`).expect(200)).body.store).toBeNull();
      expect((await admin.get(`/api/users/${user.id}`).expect(200)).body).not.toHaveProperty('store');
    });

    it('404s for a missing user and 400s for a bad id', async () => {
      await admin.get('/api/users/9999').expect(404);
      await admin.get('/api/users/abc').expect(400);
    });
  });

  describe('POST /api/stores', () => {
    const storeBody = (ownerId: number) => ({
      name: 'Corner Bakery and Coffee House',
      email: 'Bakery@Example.com',
      address: '12 Main Road',
      ownerId,
    });

    it('adds a store for a store owner', async () => {
      const owner = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const res = await admin.post('/api/stores').send(storeBody(owner.id)).expect(201);
      expect(res.body).toMatchObject({ ownerId: owner.id, email: 'bakery@example.com' });
    });

    it('only accepts a store owner who has no store yet', async () => {
      const user = await createUser(ctx.prisma);
      const notOwner = await admin.post('/api/stores').send(storeBody(user.id)).expect(400);
      expect(notOwner.body.message).toBe('The selected user is not a store owner');

      await admin.post('/api/stores').send(storeBody(9999)).expect(400);

      const owner = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      await createStore(ctx.prisma, owner.id);
      const taken = await admin.post('/api/stores').send(storeBody(owner.id)).expect(409);
      expect(taken.body.message).toBe('This owner already has a store');
    });

    it('rejects a duplicate store email', async () => {
      const first = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const second = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      await admin.post('/api/stores').send(storeBody(first.id)).expect(201);
      const res = await admin.post('/api/stores').send(storeBody(second.id)).expect(409);
      expect(res.body.message).toBe('A store with this email already exists');
    });

    it('applies the name rule to store names', async () => {
      const owner = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      await admin.post('/api/stores').send({ ...storeBody(owner.id), name: 'Tiny Shop' }).expect(400);
    });
  });

  describe('GET /api/stores (admin view)', () => {
    it('shows each store with its owner and rating, and unrated stores last', async () => {
      const ownerA = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const ownerB = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const ownerC = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
      const rated = await createStore(ctx.prisma, ownerA.id);
      const unrated = await createStore(ctx.prisma, ownerB.id);
      const low = await createStore(ctx.prisma, ownerC.id);
      const rater = await createUser(ctx.prisma);
      await ctx.prisma.rating.createMany({
        data: [
          { userId: rater.id, storeId: rated.id, value: 5 },
          { userId: rater.id, storeId: low.id, value: 2 },
        ],
      });

      for (const order of ['asc', 'desc']) {
        const res = await admin.get(`/api/stores?sortBy=averageRating&order=${order}`).expect(200);
        const ids = res.body.items.map((s: { id: number }) => s.id);
        expect(ids).toEqual(order === 'asc' ? [low.id, rated.id, unrated.id] : [rated.id, low.id, unrated.id]);
      }

      const res = await admin.get(`/api/stores?email=${encodeURIComponent(rated.email)}`).expect(200);
      expect(res.body.items).toEqual([
        expect.objectContaining({
          id: rated.id,
          averageRating: 5,
          ratingCount: 1,
          owner: { id: ownerA.id, name: ownerA.name },
        }),
      ]);
      expect(res.body.items[0]).not.toHaveProperty('myRating');
    });
  });
});
