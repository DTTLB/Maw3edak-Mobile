'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../');
const REPORT_PATH = path.join(__dirname, 'reports', 'mobile-report.md');
const TIMESTAMP = new Date().toLocaleString('en-US', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

const SCAN_DIRS = ['app', 'components', 'hooks', 'contexts', 'utils', 'types'];
const SKIP_DIRS = new Set(['node_modules', '.expo', 'android', 'ios', '.git', 'qa-agent']);
const FILE_EXTS = ['.tsx', '.ts', '.js'];

const issues = { critical: [], high: [], medium: [], low: [] };
const supabaseIssues = [];
const securityIssues = [];
const performanceIssues = [];
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
  const lineCount = lines.length;
  const baseName = path.basename(filePath);

  // ── CRITICAL ──

  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    if (/(['"`])(eyJ[A-Za-z0-9_-]{20,}|sk_live_|service_role_key)[^'"`]{8,}['"`]/.test(ln)) {
      add('critical', file, i + 1, 'Hardcoded JWT or live API key in source',
        '[value redacted for security]',
        'Move to .env immediately and rotate the exposed key. Access via process.env.EXPO_PUBLIC_* in Expo.');
      securityIssues.push({ file, line: i + 1, issue: 'Hardcoded live secret/key', fix: 'Use .env + key rotation.' });
    }
  });

  // ── HIGH ──

  // Empty catch blocks
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(ln)) {
      add('high', file, i + 1, 'Empty catch block — errors silently discarded',
        ln.trim().substring(0, 100),
        'Log the error and show user-facing feedback. An empty catch hides bugs and breaks debugging.');
    } else if (/catch\s*\([^)]*\)\s*\{/.test(ln) && i + 1 < lines.length && /^\s*\}\s*$/.test(lines[i + 1])) {
      add('high', file, i + 1, 'Empty catch block — errors silently discarded',
        ln.trim().substring(0, 100),
        'Log the error and show user-facing feedback. An empty catch hides bugs and breaks debugging.');
    }
  }

  // AsyncStorage with sensitive keys
  if (content.includes('AsyncStorage')) {
    lines.forEach((ln, i) => {
      if (/AsyncStorage\.(setItem|getItem)\s*\(\s*['"`][^'"`]*(token|password|secret|key|auth|session)[^'"`]*['"`]/i.test(ln)) {
        add('high', file, i + 1, 'Sensitive data stored in unencrypted AsyncStorage',
          ln.trim().substring(0, 100),
          'Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.');
        securityIssues.push({ file, line: i + 1, issue: 'Sensitive key in AsyncStorage', fix: 'Migrate to expo-secure-store.' });
      }
    });
  }

  // Subscription without cleanup
  if ((content.includes('.subscribe(') || content.includes('.on(')) && content.includes('useEffect')) {
    if (!content.includes('return () =>') && !content.includes('.unsubscribe') && !content.includes('.off(')) {
      add('high', file, 1, 'Subscription inside useEffect with no cleanup — memory leak risk',
        'useEffect sets up subscription but no cleanup function (return () => ...) found',
        'Return a cleanup: `return () => subscription.unsubscribe()` to prevent memory leaks and stale updates.');
      performanceIssues.push({ file, issue: 'Memory leak: subscription without cleanup', fix: 'Return cleanup from useEffect.' });
    }
  }

  // ── MEDIUM ──

  // TypeScript any
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    if ((/:\s*any[\s;,)\]>]/.test(ln) || /as\s+any[\s;,)\]>]/.test(ln)) && !t.startsWith('//')) {
      add('medium', file, i + 1, 'TypeScript `any` type — bypasses type checking',
        t.substring(0, 100),
        'Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.');
    }
  });

  // .then() without .catch()
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//')) return;
    if (/\.then\s*\(/.test(ln) && !/\.catch\s*\(/.test(ln)) {
      let hasCatch = false;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (/\.catch\s*\(/.test(lines[j])) { hasCatch = true; break; }
      }
      if (!hasCatch) {
        add('medium', file, i + 1, 'Promise .then() without .catch() — unhandled rejection',
          t.substring(0, 100),
          'Add .catch(err => ...) or rewrite as async/await with try/catch to cover all error paths.');
      }
    }
  });

  // Large files
  if (lineCount > 400) {
    add('medium', file, 1, `Large file (${lineCount} lines) — hard to maintain`,
      `${lineCount} lines of code in a single file`,
      'Extract sub-components into separate files and move business logic into custom hooks.');
  }

  // FlatList without keyExtractor
  lines.forEach((ln, i) => {
    if (/<FlatList[\s\r\n]/.test(ln)) {
      let hasKey = false;
      for (let j = i; j < Math.min(i + 15, lines.length); j++) {
        if (/keyExtractor\s*=/.test(lines[j])) { hasKey = true; break; }
        if (j > i && /\/>|<\/FlatList>/.test(lines[j])) break;
      }
      if (!hasKey) {
        add('medium', file, i + 1, 'FlatList without keyExtractor prop',
          ln.trim().substring(0, 100),
          'Add `keyExtractor={(item) => String(item.id)}` to prevent key-warning errors and incorrect list updates.');
      }
    }
  });

  // Supabase call without error destructuring
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//')) return;
    if (/await\s+supabase\.(from|rpc|storage|auth|functions)/.test(ln)) {
      let hasErrorHandling = false;
      for (let j = Math.max(0, i - 2); j < Math.min(i + 3, lines.length); j++) {
        if (/\bdata\b.*\berror\b|\berror\b.*\bdata\b/.test(lines[j])) { hasErrorHandling = true; break; }
      }
      if (!hasErrorHandling) {
        add('medium', file, i + 1, 'Supabase call result not destructured for error',
          t.substring(0, 100),
          'Use `const { data, error } = await supabase...` then `if (error) throw error` before using data.');
        supabaseIssues.push({ file, line: i + 1, issue: 'Supabase call missing error destructuring', fix: 'Destructure { data, error } and check error.' });
      }
    }
  });

  // Missing loading state
  if ((content.includes('supabase') || content.includes('fetch(')) &&
      !content.includes('loading') && !content.includes('isLoading') && !content.includes('isFetching')) {
    if (content.includes('useEffect') || content.includes('async () =>') || content.includes('async function')) {
      add('medium', file, 1, 'Async data fetching without loading state',
        'No loading/isLoading variable found in file with data fetching',
        'Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.');
    }
  }

  // Hardcoded URLs
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    if (/['"`]https?:\/\/(?!via\.placeholder|picsum|i\.imgur)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^'"`\s]*['"`]/.test(ln)) {
      if (!/process\.env|Constants\.expoConfig|EXPO_PUBLIC|__DEV__/.test(ln)) {
        add('medium', file, i + 1, 'Hardcoded URL — should be an environment variable',
          t.substring(0, 100),
          'Move to .env as EXPO_PUBLIC_API_URL and access via process.env.EXPO_PUBLIC_API_URL.');
      }
    }
  });

  // Layout without ErrorBoundary
  if ((baseName === '_layout.tsx' || baseName === '_layout.js') && !content.includes('ErrorBoundary')) {
    add('medium', file, 1, 'Layout file missing ErrorBoundary wrapper',
      'No <ErrorBoundary> found — runtime errors will white-screen the app',
      'Wrap <Slot /> with <ErrorBoundary> to gracefully handle crashes and show a fallback UI.');
  }

  // ── LOW ──

  // console statements
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    if (/console\.(log|warn|error|debug|info)\s*\(/.test(ln)) {
      add('low', file, i + 1, 'console statement in production code',
        t.substring(0, 80),
        'Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.');
    }
  });

  // TODO/FIXME/HACK
  lines.forEach((ln, i) => {
    const match = ln.match(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)\b/i);
    if (match) {
      add('low', file, i + 1, `Unresolved ${match[1].toUpperCase()} comment`,
        ln.trim().substring(0, 100),
        'Resolve before release or create a tracked issue in your issue tracker.');
    }
  });

  // Inline onPress arrow function
  lines.forEach((ln, i) => {
    if (/onPress=\{\s*\(\)\s*=>/.test(ln)) {
      add('low', file, i + 1, 'Inline arrow function in onPress — causes re-renders',
        ln.trim().substring(0, 100),
        'Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.');
      performanceIssues.push({ file, line: i + 1, issue: 'Inline onPress function', fix: 'Use useCallback.' });
    }
  });

  // Missing accessibilityLabel
  lines.forEach((ln, i) => {
    if (/<(TouchableOpacity|Pressable|TouchableHighlight)[\s\r\n]/.test(ln)) {
      let hasA11y = false;
      for (let j = i; j < Math.min(i + 8, lines.length); j++) {
        if (/accessibilityLabel|accessible=|aria-label/.test(lines[j])) { hasA11y = true; break; }
        if (/\/>/.test(lines[j]) && j > i) break;
      }
      if (!hasA11y) {
        add('low', file, i + 1, 'Touchable element missing accessibilityLabel',
          ln.trim().substring(0, 100),
          'Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).');
      }
    }
  });
}

function buildReport() {
  const sortFn = (arr) => [...arr].sort((a, b) => a.file.localeCompare(b.file));
  const allFiles = [...affectedFiles].sort();

  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')); } catch {}

  const testCases = [
    'TC-001: Patient login with valid credentials succeeds and routes to patient tabs',
    'TC-002: Patient login with wrong password shows a clear error message',
    'TC-003: Doctor login routes to doctor-tabs dashboard correctly',
    'TC-004: Forgot password OTP delivered to registered email',
    'TC-005: OTP verification rejects incorrect and expired codes',
    'TC-006: Reset password accepts strong password, rejects weak ones',
    'TC-007: Session persists after cold app restart (token refresh via SecureStore)',
    'TC-008: Expired session redirects user to login screen',
    'TC-009: Logout clears SecureStore, AsyncStorage, and resets router to index',
    'TC-010: Biometric gate blocks access to protected tabs without auth',
    'TC-011: Patient can browse available doctors list with filters applied',
    'TC-012: Patient books appointment with open slot — slot becomes unavailable',
    'TC-013: Patient cannot book an already-taken slot',
    'TC-014: Doctor views appointment list for the day correctly',
    'TC-015: Doctor can mark an appointment as completed',
    'TC-016: Doctor time-management blocks create unavailability correctly',
    'TC-017: Registration form validates all required fields before submission',
    'TC-018: Duplicate email/phone registration shows a specific conflict error',
    'TC-019: Profile edit saves changes and reflects them in the UI immediately',
    'TC-020: Push notification arrives and navigates to correct screen on tap',
    'TC-021: FCM token stored and refreshed correctly after device restart',
    'TC-022: Notification badge count updates after reading notifications',
    'TC-023: App shows error UI when network is offline',
    'TC-024: App recovers gracefully after network reconnects',
    'TC-025: Large appointment list (50+ items) scrolls smoothly via FlatList',
    'TC-026: Android back button closes modals and navigates back correctly',
    'TC-027: Safe area insets render correctly on iPhone 14 Pro (notch)',
    'TC-028: Keyboard avoidance works in all form screens on Android and iOS',
    'TC-029: RLS policy blocks patient from reading another patient\'s appointments',
    'TC-030: Supabase realtime subscription updates appointment status live',
    'TC-031: Storage uploads complete and preview renders without layout shift',
    'TC-032: Vision / dental / nutrition / medication records load and filter correctly',
    'TC-033: QR / card scanner modal opens, scans, and closes cleanly',
    'TC-034: Dark mode and light mode render consistently across all screens',
  ];

  const status = issues.critical.length > 0
    ? '🔴 BLOCKED — Critical issues must be resolved before release'
    : issues.high.length > 0
    ? '🟠 AT RISK — High issues should be fixed before release'
    : '🟢 PASS — No critical or high issues found';

  let md = `# 📱 Mobile QA Report — Maw3edak Mobile\n\n`;
  md += `**Generated:** ${TIMESTAMP}  \n`;
  md += `**React Native:** ${pkg.dependencies?.['react-native'] || 'unknown'}  \n`;
  md += `**Expo:** ${pkg.dependencies?.expo || 'unknown'}  \n`;
  md += `**Backend:** Supabase  \n`;
  md += `**Scanned:** ${SCAN_DIRS.join(', ')}  \n\n`;
  md += `---\n\n`;

  md += `## Summary\n\n`;
  md += `| Severity | Count |\n|---|---|\n`;
  md += `| 🔴 Critical | **${issues.critical.length}** |\n`;
  md += `| 🟠 High | **${issues.high.length}** |\n`;
  md += `| 🟡 Medium | **${issues.medium.length}** |\n`;
  md += `| 🔵 Low | **${issues.low.length}** |\n`;
  md += `| ☁️ Supabase | **${supabaseIssues.length}** |\n`;
  md += `| 🔐 Security | **${securityIssues.length}** |\n`;
  md += `| ⚡ Performance | **${performanceIssues.length}** |\n`;
  md += `| 📄 Files Affected | **${allFiles.length}** |\n\n`;
  md += `---\n\n`;

  const section = (title, items, prefix) => {
    md += `## ${title}\n\n`;
    if (!items.length) { md += `_No issues found._\n\n`; }
    else {
      sortFn(items).forEach((item, i) => {
        md += `### ${prefix}-${String(i + 1).padStart(3, '0')}: ${item.title || item.issue}\n`;
        if (item.file) md += `- **File:** \`${item.file}\`${item.line ? ` (line ${item.line})` : ''}\n`;
        if (item.detail) md += `- **Detail:** ${item.detail}\n`;
        if (item.fix) md += `- **Fix:** ${item.fix}\n`;
        md += '\n';
      });
    }
    md += `---\n\n`;
  };

  section('🔴 Critical Issues', issues.critical, 'C');
  section('🟠 High Issues', issues.high, 'H');
  section('🟡 Medium Issues', issues.medium, 'M');
  section('🔵 Low Issues', issues.low, 'L');
  section('☁️ Supabase Issues', supabaseIssues, 'SUP');
  section('🔐 Security Issues', securityIssues, 'SEC');
  section('⚡ Performance Issues', performanceIssues, 'PERF');

  md += `## 📄 Affected Files (${allFiles.length})\n\n`;
  if (!allFiles.length) { md += '_No files with detected issues._\n\n'; }
  else { allFiles.forEach(f => { md += `- \`${f}\`\n`; }); }
  md += '\n---\n\n';

  md += `## ✅ Mobile Test Cases\n\n`;
  testCases.forEach(tc => { md += `- [ ] ${tc}\n`; });
  md += '\n---\n\n';

  md += `## Final Status\n\n**${status}**\n\n`;
  md += `> Report generated by Mobile QA Agent. Review all flagged items before release.  \n`;
  md += `> Last run: ${TIMESTAMP}\n`;

  return md;
}

// ── MAIN ──
console.log('\n🔍 Mobile QA Agent — Maw3edak Mobile\n');
console.log('Scanning directories...\n');

let totalFiles = 0;
for (const dir of SCAN_DIRS) {
  const files = walkDir(path.join(ROOT, dir));
  totalFiles += files.length;
  console.log(`  📁 ${dir.padEnd(14)} ${files.length} files`);
  files.forEach(analyzeFile);
}

console.log(`\n  Total: ${totalFiles} files scanned`);

const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(REPORT_PATH, buildReport(), 'utf-8');

console.log(`\n📊 Results:\n`);
console.log(`  🔴 Critical  : ${issues.critical.length}`);
console.log(`  🟠 High      : ${issues.high.length}`);
console.log(`  🟡 Medium    : ${issues.medium.length}`);
console.log(`  🔵 Low       : ${issues.low.length}`);
console.log(`  🔐 Security  : ${securityIssues.length}`);
console.log(`  ⚡ Perf      : ${performanceIssues.length}`);
console.log(`  ☁️  Supabase  : ${supabaseIssues.length}`);
console.log(`\n✅ Report → qa-agent/mobile/reports/mobile-report.md\n`);
