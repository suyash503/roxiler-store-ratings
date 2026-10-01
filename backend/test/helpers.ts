import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Role } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';

export const PASSWORD = 'Secret@123';

export interface TestContext {
  app: INestApplication<App>;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);
  return { app, prisma, http: () => request(app.getHttpServer()) };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe('TRUNCATE ratings, stores, users RESTART IDENTITY CASCADE');
}

let counter = 0;
/** A name that satisfies the 20–60 character rule. */
export const validName = (label = 'Test') => `${label} Person Number ${String(++counter).padStart(4, '0')}`;

export async function createUser(
  prisma: PrismaService,
  overrides: Partial<{ name: string; email: string; address: string; role: Role }> = {},
) {
  const n = ++counter;
  return prisma.user.create({
    data: {
      name: overrides.name ?? validName(overrides.role ?? 'User'),
      email: overrides.email ?? `user${n}@example.com`,
      address: overrides.address ?? `${n} Test Street, Test City`,
      role: overrides.role ?? Role.USER,
      passwordHash: await hash(PASSWORD, 4),
    },
  });
}

export async function createStore(
  prisma: PrismaService,
  ownerId: number,
  overrides: Partial<{ name: string; email: string; address: string }> = {},
) {
  const n = ++counter;
  return prisma.store.create({
    data: {
      name: overrides.name ?? `Test Store Number ${String(n).padStart(4, '0')}`,
      email: overrides.email ?? `store${n}@example.com`,
      address: overrides.address ?? `${n} Market Road, Test City`,
      ownerId,
    },
  });
}

/** A supertest agent that keeps the session cookie between requests. */
export async function loginAs(ctx: TestContext, email: string, password = PASSWORD) {
  const agent = request.agent(ctx.app.getHttpServer());
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return agent;
}

/** Creates a user with the given role and returns a logged-in agent for them. */
export async function signedIn(ctx: TestContext, role: Role) {
  const user = await createUser(ctx.prisma, { role });
  return { user, agent: await loginAs(ctx, user.email) };
}
