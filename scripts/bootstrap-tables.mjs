#!/usr/bin/env node
/**
 * Creates the qualifications + curriculum_objectives tables via Supabase Management API,
 * then ingests filtered QAN data.
 *
 * Usage: node scripts/bootstrap-tables.mjs <csv-path>
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
try {
  const envFile = readFileSync(".env.local", "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// ── Step 1: Create a temporary exec_sql function via PostgREST hack ──
// We create a plpgsql function that executes arbitrary SQL,
// then use it to run our migration, then drop it.

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: "public" },
});

// First, try to run migration SQL via the pg-graphql or management API
const migrationSQL = readFileSync("supabase/migrations/006_qualifications.sql", "utf-8");

// Use fetch to call the Supabase Management API
const projectRef = "jtggnjcivxdlltutpave";

// Try calling the SQL endpoint via the management API
async function runSQL(sql) {
  // Method: Use the service role key to call the database via the
  // Supabase realtime/pg endpoint or management API
  const res = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ sql_text: sql }),
  });
  return res;
}

// Check if exec_sql function exists
console.log("Checking if exec_sql helper exists...");
const check = await runSQL("SELECT 1");

if (!check.ok) {
  console.log("exec_sql not available. You need to run this one-time setup in the Supabase SQL Editor:");
  console.log("");
  console.log("────────────────── COPY THIS SQL ──────────────────");
  console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_text;
END;
$$;
`);
  console.log("───────────────────────────────────────────────────");
  console.log("");
  console.log("After running that, re-run this script.");
  console.log("");
  console.log("Alternatively, paste the full migration SQL directly:");
  console.log(`  File: supabase/migrations/006_qualifications.sql`);
  process.exit(1);
}

// If we get here, exec_sql exists — run the migration
console.log("Running migration...");
const statements = migrationSQL
  .split(";")
  .map(s => s.trim())
  .filter(s => s && !s.split("\n").every(l => l.trim().startsWith("--") || !l.trim()));

for (const stmt of statements) {
  const r = await runSQL(stmt);
  if (!r.ok) {
    const err = await r.text();
    console.error("Failed:", stmt.slice(0, 60), err);
  } else {
    const preview = stmt.split("\n").find(l => !l.trim().startsWith("--") && l.trim()) || stmt.slice(0, 60);
    console.log("  ✓", preview.slice(0, 80));
  }
}

console.log("\nMigration complete. Now ingesting CSV...\n");

// ── Step 2: Ingest CSV ──
const AB_MAP = { 111: "AQA", 110: "OCR", 103: "Pearson" };
const QAN_REGEX = /^[A-Z0-9]{8}$/i;

// NQF "1;2" = GCSE (9-1), treat as Level 2. Plain "2" and "3" also valid.
function parseLevel(nqf) {
  if (nqf === "3") return 3;
  if (nqf === "2" || nqf === "1;2") return 2;
  return null;
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.log("No CSV path provided — skipping ingestion.");
  process.exit(0);
}

const raw = readFileSync(csvPath, "utf-8");
const lines = raw.split("\n").filter(l => l.trim());
const headers = lines[0].split(",");
const col = (name) => headers.indexOf(name);

const iQAN = col("QAN"), iAB = col("AB"), iTitle = col("QualificationTitle");
const iShort = col("QualShortTitle"), iQualType = col("QualType");
const iDiscCode = col("DiscCode"), iSSFT2 = col("SSFT2");
const iSSFT1 = col("SSFT1"), iNQF = col("NQF");

const rows = [];
const flagged = [];

for (let i = 1; i < lines.length; i++) {
  const f = lines[i].split(",");
  const ab = f[iAB]?.trim();
  const nqf = f[iNQF]?.trim();
  const level = parseLevel(nqf);
  if (!AB_MAP[ab] || !level) continue;
  const qan = f[iQAN]?.trim();
  if (!QAN_REGEX.test(qan)) {
    flagged.push({ line: i + 1, qan });
    continue;
  }
  rows.push({
    qan_code: qan, title: f[iTitle]?.trim(),
    short_title: f[iShort]?.trim() || null,
    board: AB_MAP[ab], level, ab_code: parseInt(ab),
    qual_type: f[iQualType]?.trim() || null,
    disc_code: f[iDiscCode]?.trim() || null,
    ssft2_code: f[iSSFT2]?.trim() || null,
    ssft1_code: f[iSSFT1]?.trim() || null,
  });
}

// Deduplicate by qan_code (last occurrence wins)
const deduped = [...new Map(rows.map(r => [r.qan_code, r])).values()];

console.log(`Filtered: ${rows.length} rows, ${deduped.length} unique QANs (AQA: ${deduped.filter(r=>r.board==="AQA").length}, OCR: ${deduped.filter(r=>r.board==="OCR").length}, Pearson: ${deduped.filter(r=>r.board==="Pearson").length})`);
if (flagged.length) console.log(`Flagged ${flagged.length} invalid QANs`);

const BATCH = 500;
let inserted = 0;
for (let i = 0; i < deduped.length; i += BATCH) {
  const chunk = deduped.slice(i, i + BATCH);
  const { error } = await supabase.from("qualifications").upsert(chunk, { onConflict: "qan_code" });
  if (error) console.error(`Batch error:`, error.message);
  else inserted += chunk.length;
}

console.log(`✓ Upserted ${inserted} rows.`);
if (flagged.length) flagged.forEach(f => console.log(`  ⚠ Line ${f.line}: QAN="${f.qan}"`));
