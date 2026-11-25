import fs from 'fs';
import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

function resolveDatabasePath(): string {
  // 1. Explicit database path override
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }

  // 2. Explicit file: URL in DATABASE_URL
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
    const rawPath = process.env.DATABASE_URL.replace(/^file:/, '');
    return path.resolve(rawPath);
  }

  // 3. Test environment
  if (process.env.NODE_ENV === 'test') {
    if (process.env.TEST_DB_PATH) {
      return path.resolve(process.env.TEST_DB_PATH);
    }
    const testCandidates = [
      path.resolve(process.cwd(), 'test.db'),
      path.resolve(process.cwd(), 'backend', 'test.db'),
      path.resolve(__dirname, '../../test.db'),
      path.resolve(__dirname, '../../../test.db'),
    ];
    for (const cand of testCandidates) {
      if (fs.existsSync(cand)) return cand;
    }
    return testCandidates[0];
  }

  // 4. Production or local development: find existing dev.db
  const candidates = [
    path.resolve(process.cwd(), 'dev.db'),
    path.resolve(process.cwd(), 'backend', 'dev.db'),
    path.resolve(__dirname, '../../../dev.db'), // from dist/src/utils/prisma.js
    path.resolve(__dirname, '../../dev.db'),    // from src/utils/prisma.ts
    path.resolve(__dirname, '../dev.db'),
  ];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      return cand;
    }
  }

  // Default fallback if brand new
  return path.resolve(process.cwd(), 'dev.db');
}

const resolvedPath = resolveDatabasePath();
console.log(`[Database] Connected to SQLite database at: ${resolvedPath}`);

const adapter = new PrismaBetterSqlite3({ url: `file:${resolvedPath}` });
const prisma = new PrismaClient({ adapter });

export default prisma;
