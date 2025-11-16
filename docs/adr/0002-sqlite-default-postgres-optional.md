# ADR 0002: SQLite as Default Database with Optional PostgreSQL

**Date**: 2025-11-16  
**Status**: Accepted  
**Deciders**: Engineering Team

## Context

The platform requires a relational database for authentication, sessions, rate limiting, and potentially content metadata. We needed to balance local development ease with production scalability.

## Decision

We use **SQLite as the default database** with `DATABASE_URL=file:../data/app.db`, providing an **optional PostgreSQL** path via Docker Compose for developers who need it or for production deployments.

## Rationale

**Why SQLite Default:**
- Zero configuration for local development
- No Docker requirement for day-to-day work
- File-based database commits to Git for reproducible state
- Excellent for development, testing, and low-traffic production
- Prisma provides identical API across SQLite and PostgreSQL
- Modern SQLite (3.45+) supports JSON, full-text search, and concurrent writes

**Why PostgreSQL Optional:**
- Production-grade scalability when needed
- Better concurrency for high-traffic scenarios
- Advanced features (JSONB, full-text search, extensions)
- Managed hosting options (Azure Database for PostgreSQL, Supabase)
- Easy migration path: same Prisma schema works for both

**Implementation:**
- `DATABASE_URL=file:../data/app.db` in `.env.example`
- `docker-compose.dev.yml` provides Postgres 17.6 on port 5432
- Developers override `DATABASE_URL` only when needed
- Production can use either SQLite (persistent volume) or PostgreSQL

**Alternatives Considered:**
1. **PostgreSQL Required** - Adds Docker complexity for all developers; overkill for low traffic
2. **MySQL** - Less TypeScript-friendly; Prisma support not as strong
3. **MongoDB** - Document model doesn't fit relational auth/session needs
4. **Turso (libSQL)** - Interesting but adds vendor lock-in; less mature ecosystem

## Consequences

**Positive:**
- Instant local setup: `just bootstrap && just dev`
- No Docker required unless Redis/Azurite needed
- Smaller resource footprint for local development
- File-based backup/restore is trivial
- Identical Prisma API for both databases

**Negative:**
- Write concurrency limits at high scale (not a current concern)
- Less familiar to some developers who expect Postgres
- Production deployments must ensure persistent volume if using SQLite

**Mitigations:**
- Document PostgreSQL setup in README for developers who prefer it
- CI uses SQLite for faster test execution
- Production deployments use persistent volumes (`/home/site/wwwroot/data/app.db` on Azure)
- Monitor write patterns; migrate to PostgreSQL if concurrency becomes an issue
