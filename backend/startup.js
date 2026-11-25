#!/usr/bin/env node
/**
 * MEDTEC – Production startup script
 * Runs before `node dist/src/server.js` on Render.
 *
 * Purpose:
 *  1. If DATABASE_PATH points to a persistent disk location (/data/dev.db)
 *     and that file does NOT yet exist, copy the bundled dev.db seed file.
 *  2. Run `prisma migrate deploy` to apply any pending additive migrations.
 *  3. Start the Express server.
 */
'use strict';

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbTarget = process.env.DATABASE_PATH;
const dbSource = path.resolve(__dirname, 'dev.db'); // committed db shipped with repo

function log(msg) {
  console.log(`[startup] ${msg}`);
}

// ── 1. Copy seed database to persistent disk if first deploy ──────────────
if (dbTarget && dbTarget !== dbSource) {
  const targetDir = path.dirname(dbTarget);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    log(`Created directory ${targetDir}`);
  }

  if (!fs.existsSync(dbTarget)) {
    if (fs.existsSync(dbSource)) {
      fs.copyFileSync(dbSource, dbTarget);
      log(`Copied seed database from ${dbSource} → ${dbTarget}`);
    } else {
      log(`No seed database found at ${dbSource}. A fresh database will be created.`);
    }
  } else {
    log(`Persistent database already exists at ${dbTarget} – skipping copy.`);
  }
}

// ── 2. Apply any pending Prisma migrations safely ─────────────────────────
log('Running prisma migrate deploy …');
const migrateResult = spawnSync(
  'npx',
  ['prisma', 'migrate', 'deploy'],
  { stdio: 'inherit', shell: true }
);
if (migrateResult.status !== 0) {
  // If migrations fail (e.g. no migrations folder), continue anyway –
  // the DB was created by prisma db push and uses baseline.
  log('Warning: prisma migrate deploy returned a non-zero exit code. Continuing …');
}

// ── 3. Start the Express server ───────────────────────────────────────────
log('Starting Express server …');
const server = spawn('node', ['dist/src/server.js'], {
  stdio: 'inherit',
  shell: false,
  env: process.env,
});

server.on('exit', (code) => {
  process.exit(code ?? 0);
});
