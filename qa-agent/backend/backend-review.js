'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../');
const REPORT_PATH = path.join(__dirname, 'reports', 'backend-report.md');
const TIMESTAMP = new Date().toLocaleString('en-US', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

const SCAN_DIRS = ['supabase/functions', 'api'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'qa-agent']);
const FILE_EXTS = ['.ts', '.js'];

const issues = { critical: [], high: [], medium: [], low: [] };
const affectedFiles = new Set();

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...walkDir(fullPath));
      else if (FILE_EXTS.some(e => entry.name.endsWith(e))) results.push(fullPath);
    }
  } catch {}
  return results;
}

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, '/'); }

function add(level, file, line, title, detail, fix) {
  issues[level].push({ file, line, title, detail, fix });
  affectedFiles.add(file);
}

function analyzeFile(filePath) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf-8'); } catch { return; }
  const lines = content.split('\n');
  const file = rel(filePath);
  const isEdgeFn = filePath.includes('supabase') && filePath.includes('functions');
  const isApiServer = filePath.includes(path.join('api', 'server')) || filePath.includes(path.join('api', 'index'));

  // ── CRITICAL ──

  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    if (/(['"`])(eyJ[A-Za-z0-9_-]{20,}|sk_live_|service_role_key)[^'"`]{8,}(['"`])/.test(ln)) {
      add('critical', file, i + 1, 'Hardcoded secret or live JWT in source code',
        '[value redacted for security]',
        'Use Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") in Edge Functions. Rotate the exposed key immediately.');
    }
  });

  // ── HIGH ──

  // Edge function: missing auth verification
  if (isEdgeFn && content.includes('createClient')) {
    const hasAuth = content.includes('Authorization') || content.includes('auth.getUser') ||
                    content.includes('auth.getSession') || content.includes('x-api-key') ||
                    content.includes('service_role');
    if (!hasAuth) {
      add('high', file, 1, 'Edge Function does not verify caller authorization',
        'No Authorization header check, auth.getUser(), or service_role verification found',
        'Extract the JWT from `req.headers.get("Authorization")` and call `supabase.auth.getUser(token)` before processing.');
    }
  }

  // Edge function: missing CORS headers
  if (isEdgeFn && !content.includes('Access-Control-Allow-Origin') && !content.includes('corsHeaders')) {
    add('high', file, 1, 'Edge Function missing CORS headers — preflight requests will fail',
      'No CORS headers or corsHeaders constant found',
      'Add corsHeaders: `{ "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" }` and handle OPTIONS before main logic.');
  }

  // Edge function: body parsed but not validated
  if (isEdgeFn && (content.includes('req.json()') || content.includes('await req.json'))) {
    const hasValidation = content.includes('if (!') || content.includes('required') ||
                          content.includes('validate') || content.includes('typeof') ||
                          content.includes('=== undefined') || content.includes('=== null');
    if (!hasValidation) {
      add('high', file, 1, 'Request body parsed without input validation',
        'req.json() called but no validation of required fields detected',
        'After parsing, check all required fields: `if (!body.fieldName) return new Response(JSON.stringify({ error: "fieldName required" }), { status: 400 })`.');
    }
  }

  // Empty catch blocks
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(ln)) {
      add('high', file, i + 1, 'Empty catch block — errors silently swallowed',
        ln.trim().substring(0, 100),
        'Return a 500 JSON response with a sanitized error message from the catch block.');
    } else if (/catch\s*\([^)]*\)\s*\{/.test(ln) && i + 1 < lines.length && /^\s*\}\s*$/.test(lines[i + 1])) {
      add('high', file, i + 1, 'Empty catch block — errors silently swallowed',
        ln.trim().substring(0, 100),
        'Return a 500 JSON response with a sanitized error message from the catch block.');
    }
  }

  // Express: no auth middleware on write routes
  if (isApiServer) {
    const hasWriteRoutes = /app\.(post|put|delete|patch)\s*\(/.test(content);
    const hasAuthMiddleware = content.includes('verifyToken') || content.includes('authenticate') ||
                              content.includes('authMiddleware') || content.includes('req.user') ||
                              content.includes('firebaseAdmin') || content.includes('getAuth');
    if (hasWriteRoutes && !hasAuthMiddleware) {
      add('high', file, 1, 'Express write routes lack authentication middleware',
        'POST/PUT/DELETE/PATCH routes found but no auth middleware detected',
        'Add middleware to verify Firebase ID token or Supabase JWT before processing any mutating request.');
    }
  }

  // ── MEDIUM ──

  // HTTP method not checked
  if (isEdgeFn && !content.includes('req.method') && !content.includes('method')) {
    add('medium', file, 1, 'Edge Function does not validate HTTP method',
      'No req.method check found',
      'Check `req.method` early and return 405 Method Not Allowed for unsupported verbs.');
  }

  // Error message/stack exposed to client
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (/(error\.stack|error\.message|err\.stack|err\.message)/.test(ln) &&
        /(\.json\(|Response\(|res\.send)/.test(ln)) {
      add('medium', file, i + 1, 'Error details exposed in API response',
        t.substring(0, 100),
        'Return a generic message: `{ error: "Internal server error" }`. Log the full error server-side only.');
    }
  });

  // Missing rate limiting (Express only)
  if (isApiServer && !content.includes('rateLimit') && !content.includes('rate-limit') &&
      !content.includes('express-rate-limit')) {
    add('medium', file, 1, 'Express API missing rate limiting',
      'No rate-limit middleware found in server configuration',
      'Install `express-rate-limit` and apply it to all routes: `app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))`.');
  }

  // TypeScript any
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    if (/:\s*any[\s;,)\]>]/.test(ln) || /as\s+any[\s;,)\]>]/.test(ln)) {
      add('medium', file, i + 1, 'TypeScript `any` type — weakens type safety',
        t.substring(0, 100),
        'Define a typed interface for the request/response body shape.');
    }
  });

  // ── LOW ──

  // Missing explicit status code
  lines.forEach((ln, i) => {
    if (/new Response\s*\(/.test(ln) && !/status\s*:/.test(ln)) {
      let hasStatus = false;
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (/status\s*:/.test(lines[j])) { hasStatus = true; break; }
      }
      if (!hasStatus) {
        add('low', file, i + 1, 'Response missing explicit HTTP status code',
          ln.trim().substring(0, 100),
          'Always include `{ status: 200 }` (or the appropriate code) in Response options for clarity.');
      }
    }
  });

  // console.log in production
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//')) return;
    if (/console\.(log|debug)\s*\(/.test(ln)) {
      add('low', file, i + 1, 'console.log in production backend code',
        t.substring(0, 80),
        'Remove or replace with a structured logger. Debug logs can expose sensitive request data in production.');
    }
  });
}

function buildReport() {
  const sortFn = (arr) => [...arr].sort((a, b) => a.file.localeCompare(b.file));
  const allFiles = [...affectedFiles].sort();

  const testCases = [
    'TC-001: Valid JWT returns expected data from each Edge Function',
    'TC-002: Missing Authorization header returns 401 Unauthorized',
    'TC-003: Invalid/expired JWT returns 403 Forbidden',
    'TC-004: Missing required body fields return 400 with descriptive message',
    'TC-005: OPTIONS preflight returns correct CORS headers',
    'TC-006: mobile-book-appointment blocks double-booking the same slot',
    'TC-007: mobile-check-email returns correct conflict for existing email',
    'TC-008: mobile-check-phone returns correct conflict for existing phone',
    'TC-009: doctor-mobile-login validates doctor role, rejects patient credentials',
    'TC-010: mobile-change-password validates current password before updating',
    'TC-011: FCM notification server delivers push to a registered device token',
    'TC-012: FCM server handles invalid device tokens gracefully (no crash)',
    'TC-013: mobile-create-schedule-block prevents overlapping time ranges',
    'TC-014: Questionnaire Edge Functions enforce doctor-only access',
    'TC-015: All DELETE endpoints verify resource ownership before deleting',
    'TC-016: Vision/dental/nutrition endpoints enforce patient ownership via RLS',
    'TC-017: Rate limiting blocks excessive requests to notification endpoint',
    'TC-018: All Edge Functions return JSON with Content-Type: application/json',
    'TC-019: Concurrent appointment booking serializes slot reservation correctly',
    'TC-020: Edge Functions respond within acceptable latency under normal load',
  ];

  const status = issues.critical.length > 0
    ? '🔴 BLOCKED — Critical issues must be resolved before deployment'
    : issues.high.length > 0
    ? '🟠 AT RISK — High issues should be fixed before deployment'
    : '🟢 PASS — No critical or high issues found';

  let md = `# ⚙️ Backend QA Report — Maw3edak Mobile\n\n`;
  md += `**Generated:** ${TIMESTAMP}  \n`;
  md += `**Backend:** Supabase Edge Functions (Deno) + Express.js FCM Server  \n`;
  md += `**Scanned:** ${SCAN_DIRS.join(', ')}  \n\n`;
  md += `---\n\n`;

  md += `## Summary\n\n`;
  md += `| Severity | Count |\n|---|---|\n`;
  md += `| 🔴 Critical | **${issues.critical.length}** |\n`;
  md += `| 🟠 High | **${issues.high.length}** |\n`;
  md += `| 🟡 Medium | **${issues.medium.length}** |\n`;
  md += `| 🔵 Low | **${issues.low.length}** |\n`;
  md += `| 📄 Files Affected | **${allFiles.length}** |\n\n`;
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
  md += `1. **Auth verification** — Add \`supabase.auth.getUser(token)\` at the top of every Edge Function that accesses private data.\n`;
  md += `2. **Shared CORS helper** — Create \`supabase/functions/_shared/cors.ts\` with a \`corsHeaders\` export used by all functions.\n`;
  md += `3. **Input validation** — Validate all body fields immediately after \`await req.json()\`. Return 400 for missing or invalid inputs.\n`;
  md += `4. **Safe error responses** — Never expose \`error.stack\` or raw DB errors to clients. Use \`{ error: "Internal server error" }\`.\n`;
  md += `5. **Rate limiting** — Add \`express-rate-limit\` to the FCM notification server for all routes.\n\n`;
  md += `---\n\n`;

  md += `## 📄 Affected Files (${allFiles.length})\n\n`;
  if (!allFiles.length) { md += '_No files with detected issues._\n\n'; }
  else { allFiles.forEach(f => { md += `- \`${f}\`\n`; }); }
  md += '\n---\n\n';

  md += `## ✅ Backend Test Cases\n\n`;
  testCases.forEach(tc => { md += `- [ ] ${tc}\n`; });
  md += '\n---\n\n';

  md += `## Final Status\n\n**${status}**\n\n`;
  md += `> Report generated by Backend QA Agent.  \n`;
  md += `> Last run: ${TIMESTAMP}\n`;

  return md;
}

// ── MAIN ──
console.log('\n🔍 Backend QA Agent — Maw3edak Mobile\n');
console.log('Scanning backend directories...\n');

let totalFiles = 0;
for (const dir of SCAN_DIRS) {
  const files = walkDir(path.join(ROOT, dir));
  totalFiles += files.length;
  console.log(`  📁 ${dir.padEnd(25)} ${files.length} files`);
  files.forEach(analyzeFile);
}

console.log(`\n  Total: ${totalFiles} files scanned`);

const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(REPORT_PATH, buildReport(), 'utf-8');

console.log(`\n📊 Results:\n`);
console.log(`  🔴 Critical : ${issues.critical.length}`);
console.log(`  🟠 High     : ${issues.high.length}`);
console.log(`  🟡 Medium   : ${issues.medium.length}`);
console.log(`  🔵 Low      : ${issues.low.length}`);
console.log(`\n✅ Report → qa-agent/backend/reports/backend-report.md\n`);
