import { Role } from '../src/generated/prisma/enums';
import { createStore, createTestApp, createUser, resetDatabase, TestContext } from './helpers';

/** The database enforces the business rules on its own, not just the API. */
describe('Database constraints', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetDatabase(ctx.prisma));
  afterAll(() => ctx.app.close());

  async function setup() {
    const owner = await createUser(ctx.prisma, { role: Role.STORE_OWNER });
    const store = await createStore(ctx.prisma, owner.id);
    const user = await createUser(ctx.prisma);
    return { owner, store, user };
  }

  it('rejects ratings outside 1–5', async () => {
    const { store, user } = await setup();
    for (const value of [0, 6]) {
      await expect(
        ctx.prisma.rating.create({ data: { userId: user.id, storeId: store.id, value } }),
      ).rejects.toThrow(/ratings_value_range_check/);
    }
  });

  it('allows one rating per user per store', async () => {
    const { store, user } = await setup();
    await ctx.prisma.rating.create({ data: { userId: user.id, storeId: store.id, value: 3 } });
    await expect(
      ctx.prisma.rating.create({ data: { userId: user.id, storeId: store.id, value: 4 } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects short names and mixed-case emails', async () => {
    await expect(createUser(ctx.prisma, { name: 'Nineteen characters' })).rejects.toThrow(/users_name_length_check/);
    await expect(createUser(ctx.prisma, { email: 'Mixed@Example.com' })).rejects.toThrow(/users_email_lowercase_check/);
  });

  it('allows one store per owner', async () => {
    const { owner } = await setup();
    await expect(createStore(ctx.prisma, owner.id)).rejects.toMatchObject({ code: 'P2002' });
  });

  it("won't delete an owner who still has a store, and deleting a store removes its ratings", async () => {
    const { owner, store, user } = await setup();
    await ctx.prisma.rating.create({ data: { userId: user.id, storeId: store.id, value: 5 } });

    await expect(ctx.prisma.user.delete({ where: { id: owner.id } })).rejects.toBeDefined();

    await ctx.prisma.store.delete({ where: { id: store.id } });
    expect(await ctx.prisma.rating.count()).toBe(0);
  });
});
