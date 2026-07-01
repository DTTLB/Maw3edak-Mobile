'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../');
const REPORT_PATH = path.join(__dirname, 'reports', 'database-report.md');
const TIMESTAMP = new Date().toLocaleString('en-US', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

const MIGRATION_DIR = path.join(ROOT, 'supabase', 'migrations');

const issues = { critical: [], high: [], medium: [], low: [] };
const affectedFiles = new Set();

const detectedTables = {};
const rlsEnabledTables = new Set();
const rlsPolicies = {};

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...walkDir(fullPath));
      else if (entry.name.endsWith('.sql')) results.push(fullPath);
    }
  } catch {}
  return results.sort();
}

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, '/'); }

function add(level, file, line, title, detail, fix) {
  issues[level].push({ file, line, title, detail, fix });
  affectedFiles.add(file);
}

function analyzeMigration(filePath) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf-8'); } catch { return; }
  const lines = content.split('\n');
  const file = rel(filePath);

  // ── CRITICAL ──

  // DROP TABLE without IF EXISTS
  lines.forEach((ln, i) => {
    if (/DROP\s+TABLE\s+(?!IF\s+EXISTS)/i.test(ln) && !ln.trim().startsWith('--')) {
      add('critical', file, i + 1, 'DROP TABLE without IF EXISTS — will error if table is missing',
        ln.trim().substring(0, 100),
        'Use `DROP TABLE IF EXISTS public.table_name;` to make the migration idempotent and safe to re-run.');
    }
  });

  // DELETE without WHERE (wipes the table)
  lines.forEach((ln, i) => {
    if (/^\s*DELETE\s+FROM\s+\w+\s*;/i.test(ln) && !ln.trim().startsWith('--')) {
      add('critical', file, i + 1, 'DELETE FROM without WHERE clause — deletes all rows',
        ln.trim().substring(0, 100),
        'Add a WHERE clause. If intentional, use TRUNCATE and add a comment explaining why.');
    }
  });

  // ── COLLECT METADATA (cross-file analysis) ──

  // Detect CREATE TABLE
  lines.forEach((ln, i) => {
    const match = ln.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?["']?(\w+)["']?/i);
    if (match && !ln.trim().startsWith('--')) {
      const name = match[1].toLowerCase();
      if (!name.startsWith('schema_') && !name.startsWith('_')) {
        detectedTables[name] = { file, line: i + 1 };
      }
    }
  });

  // Detect ENABLE ROW LEVEL SECURITY
  lines.forEach((ln) => {
    const match = ln.match(/ALTER\s+TABLE\s+(?:public\.)?["']?(\w+)["']?\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    if (match) rlsEnabledTables.add(match[1].toLowerCase());
  });

  // Detect CREATE POLICY
  lines.forEach((ln) => {
    const match = ln.match(/CREATE\s+POLICY\s+[^(]+ON\s+(?:public\.)?["']?(\w+)["']?/i);
    if (match) {
      const t = match[1].toLowerCase();
      if (!rlsPolicies[t]) rlsPolicies[t] = 0;
      rlsPolicies[t]++;
    }
  });

  // ── HIGH ──

  // Table without PRIMARY KEY in this file
  if (/CREATE\s+TABLE/i.test(content) && !/PRIMARY\s+KEY/i.test(content) && !/CONSTRAINT.*PRIMARY/i.test(content)) {
    add('high', file, 1, 'Table created without a PRIMARY KEY',
      'No PRIMARY KEY constraint found in CREATE TABLE statement',
      'Add `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` or an appropriate primary key column.');
  }

  // ── MEDIUM ──

  // Missing created_at in tables
  if (/CREATE\s+TABLE/i.test(content) && !/created_at/i.test(content)) {
    add('medium', file, 1, 'Table missing created_at timestamp',
      'No created_at column found in this migration',
      'Add `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` for audit and chronological sorting.');
  }

  // Status/type columns without CHECK constraint
  lines.forEach((ln, i) => {
    if (/\b(status|type|role|state)\s+TEXT\b/i.test(ln) && !/CHECK/i.test(ln) && !ln.trim().startsWith('--')) {
      add('medium', file, i + 1, 'Status/type column has no CHECK constraint',
        ln.trim().substring(0, 100),
        "Add CHECK: `status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled'))` or use a custom ENUM type.");
    }
  });

  // TRUNCATE without CASCADE
  lines.forEach((ln, i) => {
    if (/\bTRUNCATE\b/i.test(ln) && !/CASCADE/i.test(ln) && !ln.trim().startsWith('--')) {
      add('medium', file, i + 1, 'TRUNCATE without CASCADE — may fail due to foreign key references',
        ln.trim().substring(0, 100),
        'Use `TRUNCATE public.table_name CASCADE;` when other tables reference this table.');
    }
  });

  // Missing indexes on common FK columns
  const commonFkColumns = ['patient_id', 'doctor_id', 'user_id', 'appointment_id'];
  commonFkColumns.forEach(col => {
    if (new RegExp(`\\b${col}\\b`, 'i').test(content)) {
      if (!new RegExp(`INDEX[^(]+\\(\\s*${col}`, 'i').test(content)) {
        add('medium', file, 1, `Possible missing index on column \`${col}\``,
          `Column "${col}" referenced in migration but no index for it found in this file`,
          `Add: \`CREATE INDEX IF NOT EXISTS idx_tablename_${col} ON public.tablename (${col});\``);
      }
    }
  });

  // ── LOW ──

  // Missing updated_at
  if (/CREATE\s+TABLE/i.test(content) && !/updated_at/i.test(content)) {
    add('low', file, 1, 'Table missing updated_at timestamp',
      'No updated_at column found',
      'Add `updated_at TIMESTAMPTZ DEFAULT NOW()` and a trigger: `CREATE TRIGGER set_updated_at BEFORE UPDATE ON table EXECUTE FUNCTION moddatetime(updated_at);`.');
  }

  // Nullable columns without comment (ambiguous intent)
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (/^\s+\w+\s+(UUID|TEXT|VARCHAR|INTEGER|BIGINT|BOOLEAN|TIMESTAMPTZ)\b/.test(t) &&
        !/NOT\s+NULL|DEFAULT|PRIMARY\s+KEY|SERIAL|GENERATED|REFERENCES/i.test(t) &&
        !t.startsWith('--') && t.endsWith(',')) {
      add('low', file, i + 1, 'Column allows NULL without explicit documentation',
        t.substring(0, 100),
        'Add NOT NULL if this field is required, or add a SQL comment explaining why NULL is intentionally allowed.');
    }
  });
}

function postAnalysis() {
  // Check for tables without RLS
  for (const [name, meta] of Object.entries(detectedTables)) {
    if (!rlsEnabledTables.has(name)) {
      add('high', meta.file, meta.line, `Table \`${name}\` has RLS not enabled`,
        `Table defined in ${meta.file}:${meta.line} — no ENABLE ROW LEVEL SECURITY found across all migrations`,
        `Add after table creation: \`ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY;\` and create SELECT/INSERT/UPDATE/DELETE policies.`);
    } else if (!rlsPolicies[name] || rlsPolicies[name] === 0) {
      add('medium', meta.file, meta.line, `Table \`${name}\` has RLS enabled but no policies defined`,
        `RLS is on but no CREATE POLICY found for "${name}" — all access is denied by default`,
        `Create at least one policy: \`CREATE POLICY "users_own_rows" ON public.${name} FOR SELECT USING (auth.uid() = user_id);\``);
    }
  }
}

function buildReport() {
  const sortFn = (arr) => [...arr].sort((a, b) => a.file.localeCompare(b.file));
  const allFiles = [...affectedFiles].sort();
  const tableCount = Object.keys(detectedTables).length;
  const rlsCount = rlsEnabledTables.size;

  const testCases = [
    'TC-001: RLS policies prevent patient from reading another patient\'s records',
    'TC-002: RLS policies allow doctor to read their own patient list only',
    'TC-003: Unauthenticated access to all protected tables is denied',
    'TC-004: Appointment slot is marked unavailable after booking',
    'TC-005: CASCADE deletes work correctly (deleting patient removes appointments)',
    'TC-006: Indexes on patient_id and doctor_id improve query performance',
    'TC-007: Foreign key constraint prevents orphaned appointment records',
    'TC-008: created_at timestamps auto-populate on every INSERT',
    'TC-009: Status columns reject values outside the CHECK constraint',
    'TC-010: All migrations run in order without errors on a fresh Supabase project',
    'TC-011: UUID primary keys generated correctly via gen_random_uuid()',
    'TC-012: Notification table handles concurrent inserts without deadlock',
    'TC-013: Storage bucket policies restrict access to authenticated users',
    'TC-014: Doctor cannot read or modify another doctor\'s patient records',
    'TC-015: Migrations are idempotent where IF NOT EXISTS is used',
  ];

  const status = issues.critical.length > 0
    ? '🔴 BLOCKED — Critical schema issues must be resolved before migration'
    : issues.high.length > 0
    ? '🟠 AT RISK — High issues should be addressed before production deployment'
    : '🟢 PASS — No critical or high schema issues found';

  let md = `# 🗄️ Database QA Report — Maw3edak Mobile\n\n`;
  md += `**Generated:** ${TIMESTAMP}  \n`;
  md += `**Database:** Supabase (PostgreSQL)  \n`;
  md += `**Scanned:** supabase/migrations  \n`;
  md += `**Tables Detected:** ${tableCount}  \n`;
  md += `**Tables with RLS Enabled:** ${rlsCount} / ${tableCount}  \n\n`;
  md += `---\n\n`;

  md += `## Summary\n\n`;
  md += `| Severity | Count |\n|---|---|\n`;
  md += `| 🔴 Critical | **${issues.critical.length}** |\n`;
  md += `| 🟠 High | **${issues.high.length}** |\n`;
  md += `| 🟡 Medium | **${issues.medium.length}** |\n`;
  md += `| 🔵 Low | **${issues.low.length}** |\n`;
  md += `| 📄 Files Affected | **${allFiles.length}** |\n\n`;

  if (tableCount > 0) {
    md += `### Table Inventory\n\n`;
    md += `| Table | RLS | Policies |\n|---|---|---|\n`;
    for (const [name] of Object.entries(detectedTables)) {
      const hasRls = rlsEnabledTables.has(name);
      const policyCount = rlsPolicies[name] || 0;
      const rlsIcon = hasRls ? '✅' : '🚫';
      const policyStr = hasRls ? (policyCount > 0 ? `${policyCount} policies` : '⚠️ no policies') : '—';
      md += `| \`${name}\` | ${rlsIcon} ${hasRls ? 'Enabled' : 'NOT enabled'} | ${policyStr} |\n`;
    }
    md += '\n';
  }

  md += `---\n\n`;

  const section = (title, items, prefix) => {
    md += `## ${title}\n\n`;
    if (!items.length) { md += `_No issues found._\n\n`; }
    else {
      sortFn(items).forEach((item, i) => {
        md += `### ${prefix}-${String(i + 1).padStart(3, '0')}: ${item.title}\n`;
        md += `- **File:** \`${item.file}\`${item.line ? ` (line ${item.line})` : ''}\n`;
        if (item.detail) md += `- **Detail:** ${item.detail}\n`;
        md += `- **Fix:** ${item.fix}\n\n`;
      });
    }
    md += `---\n\n`;
  };

  section('🔴 Critical Issues', issues.critical, 'C');
  section('🟠 High Issues', issues.high, 'H');
  section('🟡 Medium Issues', issues.medium, 'M');
  section('🔵 Low Issues', issues.low, 'L');

  md += `## Suggested Fixes\n\n`;
  md += `1. **Enable RLS on all tables** — Every public table needs \`ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;\`.\n`;
  md += `2. **Define RLS policies** — At minimum: SELECT policy for owners, INSERT policy with auth.uid() check.\n`;
  md += `3. **Index foreign key columns** — Add \`CREATE INDEX IF NOT EXISTS\` for every \`*_id\` column used in queries.\n`;
  md += `4. **CHECK constraints** — Replace unconstrained TEXT status columns with \`CHECK (status IN (...))\`.\n`;
  md += `5. **Timestamps** — Add \`created_at\` and \`updated_at\` to every table for audit and sorting.\n\n`;
  md += `---\n\n`;

  md += `## 📄 Affected Files (${allFiles.length})\n\n`;
  if (!allFiles.length) { md += '_No files with detected issues._\n\n'; }
  else { allFiles.forEach(f => { md += `- \`${f}\`\n`; }); }
  md += '\n---\n\n';

  md += `## ✅ Database Test Cases\n\n`;
  testCases.forEach(tc => { md += `- [ ] ${tc}\n`; });
  md += '\n---\n\n';

  md += `## Final Status\n\n**${status}**\n\n`;
  md += `> Report generated by Database QA Agent.  \n`;
  md += `> Last run: ${TIMESTAMP}\n`;

  return md;
}

// ── MAIN ──
console.log('\n🔍 Database QA Agent — Maw3edak Mobile\n');
console.log('Scanning SQL migrations...\n');

const files = walkDir(MIGRATION_DIR);
console.log(`  📁 supabase/migrations — ${files.length} SQL files\n`);
files.forEach(analyzeMigration);
postAnalysis();

const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(REPORT_PATH, buildReport(), 'utf-8');

console.log(`\n📊 Results:\n`);
console.log(`  🔴 Critical : ${issues.critical.length}`);
console.log(`  🟠 High     : ${issues.high.length}`);
console.log(`  🟡 Medium   : ${issues.medium.length}`);
console.log(`  🔵 Low      : ${issues.low.length}`);
console.log(`\n  Tables detected : ${Object.keys(detectedTables).length}`);
console.log(`  Tables with RLS : ${rlsEnabledTables.size}`);
console.log(`\n✅ Report → qa-agent/database/reports/database-report.md\n`);
