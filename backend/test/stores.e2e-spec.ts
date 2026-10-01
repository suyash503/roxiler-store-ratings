import { Role } from '../src/generated/prisma/enums';
import { createStore, createTestApp, createUser, resetDatabase, signedIn, TestContext } from './helpers';

describe('Stores and ratings (normal user)', () => {
  let ctx: TestContext;
  let user: Awaited<ReturnType<typeof signedIn>>;
  let storeA: { id: number; name: string };
  let storeB: { id: number; name: string };

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    user = await signedIn(ctx, Role.USER);
    const ownerA = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
    const ownerB = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
    storeA = await createStore(ctx.prisma, ownerA.id, { name: 'Sunrise Bakery and Cafe Indiranagar', address: 'Bengaluru, Karnataka' });
    storeB = await createStore(ctx.prisma, ownerB.id, { name: 'Moonlight Books and Stationery', address: 'Koramangala, Bengaluru' });
  });
  afterAll(() => ctx.app.close());

  const rate = (storeId: number, value: unknown) =>
    user.agent.put(`/api/stores/${storeId}/rating`).send({ value });

  it('lists stores with overall rating and the viewer’s own rating', async () => {
    const other = await createUser(ctx.prisma);
    await ctx.prisma.rating.create({ data: { userId: other.id, storeId: storeA.id, value: 2 } });
    await rate(storeA.id, 5).expect(200);

    const res = await user.agent.get('/api/stores?sortBy=name').expect(200);
    expect(res.body.items).toEqual([
      expect.objectContaining({ id: storeB.id, averageRating: null, ratingCount: 0, myRating: null }),
      expect.objectContaining({ id: storeA.id, averageRating: 3.5, ratingCount: 2, myRating: 5 }),
    ]);
    expect(res.body.items[0]).not.toHaveProperty('owner');
  });

  it('searches by name or address with q', async () => {
    const byName = await user.agent.get('/api/stores?q=bakery').expect(200);
    expect(byName.body.items.map((s: { id: number }) => s.id)).toEqual([storeA.id]);

    const byAddress = await user.agent.get('/api/stores?q=koramangala').expect(200);
    expect(byAddress.body.items.map((s: { id: number }) => s.id)).toEqual([storeB.id]);

    const both = await user.agent.get('/api/stores?q=bengaluru').expect(200);
    expect(both.body.total).toBe(2);
  });

  it('submits a rating, then modifies it in place', async () => {
    const first = await rate(storeA.id, 3).expect(200);
    expect(first.body).toEqual({ storeId: storeA.id, myRating: 3, averageRating: 3, ratingCount: 1 });

    const second = await rate(storeA.id, 4).expect(200);
    expect(second.body).toEqual({ storeId: storeA.id, myRating: 4, averageRating: 4, ratingCount: 1 });
    expect(await ctx.prisma.rating.count()).toBe(1);
  });

  it('keeps exactly one rating when the same user submits many at once', async () => {
    const results = await Promise.all([1, 2, 3, 4, 5, 1, 2, 3, 4, 5].map((v) => rate(storeA.id, v)));
    expect(results.map((r) => r.status)).toEqual(Array(10).fill(200));
    expect(await ctx.prisma.rating.count({ where: { storeId: storeA.id } })).toBe(1);
  });

  it.each([0, 6, 2.5, '5', null])('rejects %p as a rating', async (value) => {
    const res = await rate(storeA.id, value).expect(400);
    expect(res.body.message).toContain('Rating must be a whole number from 1 to 5');
  });

  it('404s for a store that does not exist', async () => {
    await rate(9999, 3).expect(404);
  });

  it.each([Role.ADMIN, Role.STORE_OWNER])('does not let a %s rate', async (role) => {
    const { agent } = await signedIn(ctx, role);
    await agent.put(`/api/stores/${storeA.id}/rating`).send({ value: 5 }).expect(403);
  });

  it('is not available to store owners', async () => {
    const { agent } = await signedIn(ctx, Role.STORE_OWNER);
    await agent.get('/api/stores').expect(403);
  });

  it('sorts by the viewer’s rating with unrated stores last', async () => {
    await rate(storeB.id, 1).expect(200);
    const res = await user.agent.get('/api/stores?sortBy=myRating&order=desc').expect(200);
    expect(res.body.items.map((s: { myRating: number | null }) => s.myRating)).toEqual([1, null]);
  });
});
