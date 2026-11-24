import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../dev.db');
const db = new Database(dbPath);

console.log('--- TABLES ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
console.log(tables.map((t: any) => t.name));

console.log('--- USERS ---');
const users = db.prepare("SELECT id, email, role, isActive FROM User").all();
console.log(users);
db.close();
