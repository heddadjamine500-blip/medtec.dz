import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

const defaultPath = process.env.NODE_ENV === 'test' 
  ? path.resolve(__dirname, '../../test.db')
  : path.resolve(__dirname, '../../dev.db');

const resolvedPath = process.env.TEST_DB_PATH || defaultPath;
const adapter = new PrismaBetterSqlite3({ url: `file:${resolvedPath}` });

const prisma = new PrismaClient({ adapter });

export default prisma;
