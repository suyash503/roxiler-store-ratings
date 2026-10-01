# Store Ratings

A web app where users rate stores from 1 to 5. Built for the Roxiler Systems FullStack Intern Coding Challenge.

**Stack:** NestJS 11 · PostgreSQL · Prisma 7 · React

> Work in progress. The backend API is done and tested; the React frontend is next.

## Progress

- [x] Database schema with the business rules enforced as constraints
- [x] Auth: one login for every role, httpOnly JWT cookie, password change
- [x] Admin API: dashboard totals, add users and stores, filterable and sortable lists, user details
- [x] Normal-user API: store list with search, submit and modify ratings
- [x] Store-owner API: average rating, star breakdown, who rated
- [x] 85 backend tests against a real PostgreSQL
- [ ] React frontend
- [ ] Docker Compose, CI, screenshots

## Run the backend

Needs Node 22.12+ and PostgreSQL 14+.

```bash
npm install
cp backend/.env.example backend/.env   # then set DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run db:seed
npm run start:dev -w backend           # http://localhost:4100/api, docs at /api/docs
```

Tests use a separate database named after yours with `_test` appended (e.g. `roxiler_test`). Create it once, then:

```bash
npm test -w backend
```
