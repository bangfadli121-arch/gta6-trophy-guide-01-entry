// Leonida Trophy Guide — entrypoint (Node 22, standard library only).
//
// The guide itself is plain static files under app/: index.html opens the
// checklist, app.js renders it from app/data/trophies.json, and nothing is
// fetched from the network. This program hands the entry in: it copies app/
// and screenshots/ from this repository into the output directory and writes
// /output/dossier.json with buildDossier from the vendored make.fun library.
// vendor/makefun-frontend.ts is the kit's copy and must stay untouched, or
// the scorer's own dossier will not match this one byte for byte.
//
// Local check:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory is /output (MAKEFUN_OUTPUT_DIR unset).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps mirror the scorer's limits: at most 4 screenshots of 256 KiB each,
// app/ at most 993 entries and 48 MiB, and the dossier text capped at 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
