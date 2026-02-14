#!/usr/bin/env node
/**
 * Ingest QAN_Current CSV into Supabase qualifications table.
 *
 * Filters:
 *   - Awarding Body: AQA (AB=111), OCR (AB=110), Pearson/Edexcel (AB=103)
 *   - Level: 2 (GCSE) or 3 (A-Level)
 *
 * Usage:
 *   node scripts/ingest-qualifications.mjs <path-to-csv>
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local without dotenv dependency
try {
  const envFile = readFileSync(".env.local", "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {
  // .env.local not found — rely on existing env vars
}

// ── Config ─────────────────────────────────────────────────────────────
const AB_MAP = {
  111: "AQA",
  110: "OCR",
  103: "Pearson",
};
const VALID_LEVELS = new Set(["2", "3"]);
const QAN_REGEX = /^[A-Z0-9]{8}$/i; // 8-char alphanumeric (includes leading-zero codes)

// ── Parse CSV ──────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",");

  const col = (name) => {
    const idx = headers.indexOf(name);
    if (idx === -1) throw new Error(`Column "${name}" not found. Headers: ${headers.join(", ")}`);
    return idx;
  };

  // Column indices
  const iQAN = col("QAN");
  const iAB = col("AB");
  const iTitle = col("QualificationTitle");
  const iShort = col("QualShortTitle");
  const iQualType = col("QualType");
  const iDiscCode = col("DiscCode");
  const iSSFT2 = col("SSFT2");
  const iSSFT1 = col("SSFT1");
  const iNQF = col("NQF");

  const rows = [];
  const flagged = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(",");
    const ab = fields[iAB]?.trim();
    const nqf = fields[iNQF]?.trim();

    // Filter: board + level
    if (!AB_MAP[ab] || !VALID_LEVELS.has(nqf)) continue;

    const qan = fields[iQAN]?.trim();

    // QAN format validation
    if (!QAN_REGEX.test(qan)) {
      flagged.push({ line: i + 1, qan, reason: "Does not match 8-char format" });
      continue;
    }

    rows.push({
      qan_code: qan,
      title: fields[iTitle]?.trim(),
      short_title: fields[iShort]?.trim() || null,
      board: AB_MAP[ab],
      level: parseInt(nqf),
      ab_code: parseInt(ab),
      qual_type: fields[iQualType]?.trim() || null,
      disc_code: fields[iDiscCode]?.trim() || null,
      ssft2_code: fields[iSSFT2]?.trim() || null,
      ssft1_code: fields[iSSFT1]?.trim() || null,
    });
  }

  return { rows, flagged };
}

// ── Upsert to Supabase ────────────────────────────────────────────────
async function ingest(rows) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Batch upsert in chunks of 500
  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("qualifications")
      .upsert(chunk, { onConflict: "qan_code" });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} failed:`, error.message);
    } else {
      inserted += chunk.length;
    }
  }

  return inserted;
}

// ── Main ───────────────────────────────────────────────────────────────
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/ingest-qualifications.mjs <path-to-csv>");
  process.exit(1);
}

console.log(`Parsing ${csvPath} (UTF-8)...`);
const { rows, flagged } = parseCSV(csvPath);

console.log(`\n── Data Audit ──`);
console.log(`Total matching rows: ${rows.length}`);
console.log(`  AQA:     ${rows.filter((r) => r.board === "AQA").length}`);
console.log(`  OCR:     ${rows.filter((r) => r.board === "OCR").length}`);
console.log(`  Pearson: ${rows.filter((r) => r.board === "Pearson").length}`);
console.log(`  Level 2: ${rows.filter((r) => r.level === 2).length}`);
console.log(`  Level 3: ${rows.filter((r) => r.level === 3).length}`);

if (flagged.length > 0) {
  console.log(`\n── Flagged QANs (invalid format) ──`);
  flagged.forEach((f) => console.log(`  Line ${f.line}: QAN="${f.qan}" — ${f.reason}`));
}

// Dry-run mode: pass --dry-run to skip Supabase insert
if (process.argv.includes("--dry-run")) {
  console.log("\n--dry-run: Skipping Supabase insert.");
  console.log("Sample rows:");
  rows.slice(0, 3).forEach((r) => console.log(`  ${r.qan_code} | ${r.board} | L${r.level} | ${r.title}`));
  process.exit(0);
}

console.log(`\nUpserting ${rows.length} rows to Supabase...`);
const count = await ingest(rows);
console.log(`Done. ${count} rows upserted.`);
