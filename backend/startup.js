#!/usr/bin/env node
/**
 * MEDTEC – Production startup script for Render
 * Copies seed DB to persistent disk if missing, then starts Express.
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(msg) {
  process.stdout.write(`[startup] ${msg}\n`);
}

// ── 1. Copy seed database to persistent disk on first deploy ─────────────
const dbTarget = process.env.DATABASE_PATH;
if (dbTarget) {
  const dbSource = path.resolve(__dirname, 'dev.db');
  const targetDir = path.dirname(dbTarget);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    log(`Created directory: ${targetDir}`);
  }

  if (!fs.existsSync(dbTarget)) {
    if (fs.existsSync(dbSource)) {
      fs.copyFileSync(dbSource, dbTarget);
      log(`Copied seed DB: ${dbSource} → ${dbTarget}`);
    } else {
      log(`No seed DB at ${dbSource}. A fresh database will be initialised.`);
    }
  } else {
    log(`Persistent DB already exists at ${dbTarget} – skipping copy.`);
  }
}

// ── 2. Apply Prisma migrations (additive only, safe to run every deploy) ──
try {
  log('Running: npx prisma migrate deploy');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  log('Migrations applied successfully.');
} catch (err) {
  log(`Warning: prisma migrate deploy failed (${err.message}). Continuing…`);
}

// ── 3. Hand over to Express server (replace this process) ─────────────────
log('Starting Express server…');
require('./dist/src/server.js');
