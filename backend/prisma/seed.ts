/**
 * Demo data. Idempotent: re-running updates rows in place instead of duplicating them.
 * Every account's password is listed in the README.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { Role } from '../src/generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PASSWORDS = { ADMIN: 'Admin@1234', STORE_OWNER: 'Owner@1234', USER: 'User@1234' } as const;

const users: { name: string; email: string; address: string; role: Role }[] = [
  { name: 'Platform Administrator', email: 'admin@example.com', address: '1 Admin Plaza, Connaught Place, New Delhi 110001', role: Role.ADMIN },

  { name: 'Rajeshwari Nair Menon', email: 'rajeshwari@example.com', address: '12 MG Road, Ernakulam, Kochi 682011', role: Role.STORE_OWNER },
  { name: 'Harpreet Singh Ahluwalia', email: 'harpreet@example.com', address: '44 Model Town, Ludhiana, Punjab 141002', role: Role.STORE_OWNER },
  { name: 'Fatima Siddiqui Qureshi', email: 'fatima@example.com', address: '7 Banjara Hills Road No. 2, Hyderabad 500034', role: Role.STORE_OWNER },
  { name: 'Devendra Prasad Tiwari', email: 'devendra@example.com', address: '21 Hazratganj, Lucknow, Uttar Pradesh 226001', role: Role.STORE_OWNER },
  { name: 'Lakshmi Narayanan Iyer', email: 'lakshmi@example.com', address: '5 T. Nagar Main Road, Chennai 600017', role: Role.STORE_OWNER },

  { name: 'Ananya Krishnamurthy Rao', email: 'user@example.com', address: '88 Indiranagar 100 Feet Road, Bengaluru 560038', role: Role.USER },
  { name: 'Rohan Mehta Chaturvedi', email: 'rohan@example.com', address: '3 Juhu Tara Road, Mumbai 400049', role: Role.USER },
  { name: 'Ishita Banerjee Mukherjee', email: 'ishita@example.com', address: '19 Park Street, Kolkata 700016', role: Role.USER },
  { name: 'Vikramaditya Singh Rathore', email: 'vikram@example.com', address: '2 Civil Lines, Jaipur, Rajasthan 302006', role: Role.USER },
  { name: 'Meera Subramaniam Pillai', email: 'meera@example.com', address: '60 Anna Salai, Chennai 600002', role: Role.USER },
  { name: 'Arjun Venkatesh Reddy', email: 'arjun@example.com', address: '14 Jubilee Hills, Hyderabad 500033', role: Role.USER },
  { name: 'Kavya Deshpande Kulkarni', email: 'kavya@example.com', address: '9 FC Road, Shivajinagar, Pune 411005', role: Role.USER },
  { name: 'Siddharth Narayan Joshi', email: 'siddharth@example.com', address: '31 Sector 18, Noida, Uttar Pradesh 201301', role: Role.USER },
];

// Lakshmi is deliberately left without a store, so "Add store" has an owner to pick.
const stores = [
  { name: 'Saffron Spice Kitchen & Grill', email: 'hello@saffronspice.example.com', address: '12 MG Road, Ernakulam, Kochi 682011', owner: 'rajeshwari@example.com' },
  { name: "Bookworm's Corner Bookstore", email: 'books@bookwormscorner.example.com', address: '44 Model Town Market, Ludhiana, Punjab 141002', owner: 'harpreet@example.com' },
  { name: 'GreenLeaf Organic Grocery Mart', email: 'shop@greenleaf.example.com', address: 'Road No. 2, Banjara Hills, Hyderabad 500034', owner: 'fatima@example.com' },
  { name: 'TechNest Electronics Superstore', email: 'support@technest.example.com', address: '21 Hazratganj Crossing, Lucknow 226001', owner: 'devendra@example.com' },
];

// [user email, store email, stars]
const ratings: [string, string, number][] = [
  ['user@example.com', 'hello@saffronspice.example.com', 5],
  ['user@example.com', 'books@bookwormscorner.example.com', 4],
  ['rohan@example.com', 'hello@saffronspice.example.com', 4],
  ['rohan@example.com', 'shop@greenleaf.example.com', 3],
  ['rohan@example.com', 'support@technest.example.com', 2],
  ['ishita@example.com', 'hello@saffronspice.example.com', 5],
  ['ishita@example.com', 'books@bookwormscorner.example.com', 5],
  ['vikram@example.com', 'support@technest.example.com', 3],
  ['vikram@example.com', 'shop@greenleaf.example.com', 4],
  ['meera@example.com', 'hello@saffronspice.example.com', 4],
  ['meera@example.com', 'shop@greenleaf.example.com', 5],
  ['arjun@example.com', 'support@technest.example.com', 1],
  ['arjun@example.com', 'books@bookwormscorner.example.com', 4],
  ['kavya@example.com', 'hello@saffronspice.example.com', 3],
];

async function main() {
  const hashes = {
    [Role.ADMIN]: await hash(PASSWORDS.ADMIN, 10),
    [Role.STORE_OWNER]: await hash(PASSWORDS.STORE_OWNER, 10),
    [Role.USER]: await hash(PASSWORDS.USER, 10),
  };

  const userIds = new Map<string, number>();
  for (const user of users) {
    const { id } = await prisma.user.upsert({
      where: { email: user.email },
      create: { ...user, passwordHash: hashes[user.role] },
      update: { name: user.name, address: user.address, role: user.role, passwordHash: hashes[user.role] },
    });
    userIds.set(user.email, id);
  }

  const storeIds = new Map<string, number>();
  for (const { owner, ...store } of stores) {
    const ownerId = userIds.get(owner)!;
    const { id } = await prisma.store.upsert({
      where: { email: store.email },
      create: { ...store, ownerId },
      update: { ...store, ownerId },
    });
    storeIds.set(store.email, id);
  }

  for (const [userEmail, storeEmail, value] of ratings) {
    const userId = userIds.get(userEmail)!;
    const storeId = storeIds.get(storeEmail)!;
    await prisma.rating.upsert({
      where: { userId_storeId: { userId, storeId } },
      create: { userId, storeId, value },
      update: { value },
    });
  }

  console.log(`Seeded ${users.length} users, ${stores.length} stores, ${ratings.length} ratings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
