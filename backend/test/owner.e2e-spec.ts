import { Role } from '../src/generated/prisma/enums';
import { createStore, createTestApp, createUser, resetDatabase, signedIn, TestContext } from './helpers';

describe('Store owner dashboard', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetDatabase(ctx.prisma));
  afterAll(() => ctx.app.close());

  it('shows the average, count and star breakdown, and who rated', async () => {
    const owner = await signedIn(ctx, Role.STORE_OWNER);
    const store = await createStore(ctx.prisma, owner.user.id);
    const raters = [
      await createUser(ctx.prisma, { name: 'Bhavna Kapoor Example User', email: 'bhavna@example.com' }),
      await createUser(ctx.prisma, { name: 'Aditya Rao Example Customer', email: 'aditya@example.com' }),
      await createUser(ctx.prisma, { name: 'Chirag Shah Example Customer', email: 'chirag@example.com' }),
    ];
    await ctx.prisma.rating.createMany({
      data: [
        { userId: raters[0].id, storeId: store.id, value: 5 },
        { userId: raters[1].id, storeId: store.id, value: 2 },
        { userId: raters[2].id, storeId: store.id, value: 5 },
      ],
    });
    // A rating for someone else's store must not leak in.
    const otherOwner = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
    const otherStore = await createStore(ctx.prisma, otherOwner.id);
    await ctx.prisma.rating.create({ data: { userId: raters[0].id, storeId: otherStore.id, value: 1 } });

    const dashboard = await owner.agent.get('/api/owner/dashboard').expect(200);
    expect(dashboard.body).toEqual({
      store: { id: store.id, name: store.name, email: store.email, address: store.address },
      averageRating: 4,
      ratingCount: 3,
      distribution: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 2 },
    });

    const byName = await owner.agent.get('/api/owner/ratings?sortBy=name&order=asc').expect(200);
    expect(byName.body.items.map((r: { name: string }) => r.name.split(' ')[0])).toEqual(['Aditya', 'Bhavna', 'Chirag']);

    const byValue = await owner.agent.get('/api/owner/ratings?sortBy=value&order=asc').expect(200);
    expect(byValue.body.items[0]).toMatchObject({ userId: raters[1].id, email: 'aditya@example.com', value: 2 });

    const search = await owner.agent.get('/api/owner/ratings?q=CHIRAG').expect(200);
    expect(search.body).toMatchObject({ total: 1, items: [{ email: 'chirag@example.com' }] });
  });

  it('reports an unrated store with a null average, not 0', async () => {
    const owner = await signedIn(ctx, Role.STORE_OWNER);
    await createStore(ctx.prisma, owner.user.id);
    const res = await owner.agent.get('/api/owner/dashboard').expect(200);
    expect(res.body).toMatchObject({ averageRating: null, ratingCount: 0 });
  });

  it('explains when no store is assigned yet', async () => {
    const owner = await signedIn(ctx, Role.STORE_OWNER);
    const res = await owner.agent.get('/api/owner/dashboard').expect(404);
    expect(res.body.message).toBe('No store is assigned to your account yet');
  });

  it.each([Role.ADMIN, Role.USER])('is off-limits to a %s', async (role) => {
    const { agent } = await signedIn(ctx, role);
    await agent.get('/api/owner/dashboard').expect(403);
    await agent.get('/api/owner/ratings').expect(403);
  });
});
