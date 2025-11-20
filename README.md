# FETS.LIVE-2025

FETS.LIVE is a comprehensive staff management and operations platform built with React, TypeScript, Vite, and Supabase.

## Project Structure

- **fets-point/**: Main React application.
- **scripts/**: Database and deployment scripts.
  - **maintenance/**: Maintenance and verification scripts.
- **docs/**: Project documentation and guides.
- **supabase/**: Supabase configuration.

## Documentation

Key documentation files can be found in the `docs/` directory:

- [Getting Started](docs/GETTING_STARTED.md)
- [Start Here](docs/START-HERE.md)
- [Migration Instructions](docs/MIGRATION_INSTRUCTIONS.md)
- [Work Completed](docs/WORK-COMPLETED.md)
- [Brainstorm Feature](docs/BRAINSTORM_FEATURE.md)

## Quick Start

To start the development server:

```bash
cd fets-point
pnpm install
pnpm dev
```

## Scripts

Maintenance and verification scripts are located in `scripts/maintenance/`. You can run them using `node` or `pnpm`.

Example:
```bash
node scripts/maintenance/verify-database.js
```
