'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../');
const REPORT_PATH = path.join(__dirname, 'reports', 'frontend-report.md');
const TIMESTAMP = new Date().toLocaleString('en-US', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

const SCAN_DIRS = ['app', 'components'];
const SKIP_DIRS = new Set(['node_modules', '.expo', 'android', 'ios', '.git', 'qa-agent']);
const FILE_EXTS = ['.tsx', '.ts', '.js'];

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
  const lineCount = lines.length;

  // ── HIGH ──

  // ScrollView wrapping .map() for server data — should be FlatList
  if (content.includes('ScrollView') && !content.includes('FlatList') && !content.includes('SectionList')) {
    if (content.includes('.map(') && (content.includes('supabase') || content.includes('useState'))) {
      add('high', file, 1, 'ScrollView used for dynamic data list — use FlatList instead',
        'ScrollView renders all items into the DOM at once; no virtualization',
        'Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.');
    }
  }

  // Direct state mutation
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//')) return;
    if (/\bstate\.\w+\s*=\s*(?!==)/.test(ln) || /\bprevState\.\w+\s*=\s*(?!==)/.test(ln)) {
      add('high', file, i + 1, 'Direct state mutation detected',
        t.substring(0, 100),
        'Never mutate state directly. Use the setter: `setState(prev => ({ ...prev, field: value }))`.');
    }
  });

  // ── MEDIUM ──

  // Large file
  if (lineCount > 350) {
    add('medium', file, 1, `Large screen/component (${lineCount} lines)`,
      `${lineCount} lines in a single file is difficult to review, test, and maintain`,
      'Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.');
  }

  // Inline style objects (more than 5)
  let inlineStyleCount = 0;
  lines.forEach((ln) => { if (/style=\{\{/.test(ln)) inlineStyleCount++; });
  if (inlineStyleCount > 5) {
    add('medium', file, 1, `${inlineStyleCount} inline style={{ }} objects — causes re-renders on every render`,
      `${inlineStyleCount} occurrences of style={{ ... }} found`,
      'Move all styles to a `StyleSheet.create({})` object at the bottom of the file. Inline objects are re-created each render.');
  }

  // Missing loading state for async screens
  if ((content.includes('supabase') || content.includes('fetch(')) &&
      !content.includes('loading') && !content.includes('isLoading') && !content.includes('isFetching')) {
    add('medium', file, 1, 'Screen with async data has no loading state',
      'Data-fetching code found but no loading/isLoading state variable detected',
      'Add `const [loading, setLoading] = useState(true)` and show an `<ActivityIndicator />` while loading.');
  }

  // .map() without key prop
  lines.forEach((ln, i) => {
    if (/\.map\s*\(/.test(ln) && /(return\s+<|=>\s+<|=>\s*\()/.test(ln)) {
      let hasKey = false;
      for (let j = i; j < Math.min(i + 6, lines.length); j++) {
        if (/\bkey\s*=/.test(lines[j])) { hasKey = true; break; }
      }
      if (!hasKey) {
        add('medium', file, i + 1, '.map() list missing key prop on root element',
          ln.trim().substring(0, 100),
          'Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.');
      }
    }
  });

  // useMemo/useCallback with empty []
  lines.forEach((ln, i) => {
    if (/use(Memo|Callback)\s*\(/.test(ln)) {
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (/\},\s*\[\s*\]\s*\)/.test(lines[j])) {
          add('low', file, j + 1, 'useMemo/useCallback with empty dependency array []',
            lines[j].trim().substring(0, 100),
            'Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.');
          break;
        }
      }
    }
  });

  // ── LOW ──

  // Hardcoded hex colors (design inconsistency)
  let colorCount = 0;
  lines.forEach((ln) => {
    if (/#[0-9A-Fa-f]{3,6}\b/.test(ln) && !ln.trim().startsWith('//') && !ln.trim().startsWith('*')) {
      colorCount++;
    }
  });
  if (colorCount > 3) {
    add('low', file, 1, `${colorCount} hardcoded hex colors — breaks theme consistency`,
      `${colorCount} hex color values (#xxxxxx) found inline`,
      'Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.');
  }

  // console statements
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    if (/console\.(log|debug)\s*\(/.test(ln)) {
      add('low', file, i + 1, 'console statement in UI file',
        t.substring(0, 80),
        'Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.');
    }
  });

  // TODO/FIXME
  lines.forEach((ln, i) => {
    const match = ln.match(/\/\/\s*(TODO|FIXME|HACK)\b/i);
    if (match) {
      add('low', file, i + 1, `Unresolved ${match[1].toUpperCase()} comment`,
        ln.trim().substring(0, 100),
        'Resolve before release or create a tracked issue.');
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
          'Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.');
      }
    }
  });
}

function buildReport() {
  const sortFn = (arr) => [...arr].sort((a, b) => a.file.localeCompare(b.file));
  const allFiles = [...affectedFiles].sort();

  const testCases = [
    'TC-001: Patient tab screens render without crash on Android and iOS',
    'TC-002: Doctor tab screens render without crash on Android and iOS',
    'TC-003: Auth screens display correctly on small screen (iPhone SE)',
    'TC-004: Auth screens display correctly on large screen (iPhone 14 Pro Max)',
    'TC-005: All form fields use the correct keyboard type (email, phone, password)',
    'TC-006: Form validation error messages display clearly below each field',
    'TC-007: Loading spinner shows while data is being fetched from Supabase',
    'TC-008: Error state UI shown when a network request fails',
    'TC-009: Empty state UI shown when a list has no results',
    'TC-010: Appointment FlatList scrolls smoothly with 50+ items',
    'TC-011: Bottom navigation tabs highlight the active tab correctly',
    'TC-012: Dark mode renders consistently across all screens',
    'TC-013: RTL layout (Arabic content) renders correctly',
    'TC-014: Pull-to-refresh works on all list screens',
    'TC-015: Filter bottom sheet opens, applies filter, dismisses correctly',
    'TC-016: Modal opens and closes without layout shift',
    'TC-017: Back navigation from nested screens returns to correct parent',
    'TC-018: Deep link from notification navigates to the correct screen',
    'TC-019: Profile avatar upload and preview works correctly',
    'TC-020: Appointment booking form prevents double-submission (button disabled)',
    'TC-021: Settings screen saves preferences and reflects them immediately',
    'TC-022: Help center screen renders content without layout overflow',
    'TC-023: Invoice amounts formatted correctly with currency symbol',
    'TC-024: Doctor patient-detail screen shows complete history',
    'TC-025: Safe area insets prevent content from being hidden by notch/home indicator',
    'TC-026: Keyboard avoidance works in all form screens (input not hidden by keyboard)',
  ];

  const status = issues.critical.length > 0
    ? '🔴 BLOCKED — Critical UI issues must be resolved'
    : issues.high.length > 0
    ? '🟠 AT RISK — High issues affect UX quality and should be fixed'
    : '🟢 PASS — No critical or high UI issues found';

  let md = `# 🎨 Frontend QA Report — Maw3edak Mobile\n\n`;
  md += `**Generated:** ${TIMESTAMP}  \n`;
  md += `**UI Layer:** React Native / Expo Router  \n`;
  md += `**Scanned:** ${SCAN_DIRS.join(', ')} (screens and components)  \n\n`;
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
  md += `1. **StyleSheet.create** — Replace all inline \`style={{ }}\` with \`StyleSheet.create({})\` declarations at the bottom of each file.\n`;
  md += `2. **Loading states** — Every screen fetching from Supabase should have a loading state that shows an \`<ActivityIndicator />\`.\n`;
  md += `3. **FlatList for dynamic lists** — Replace \`ScrollView + .map()\` patterns with \`<FlatList>\` for all server-driven lists.\n`;
  md += `4. **Design system** — Centralize all colors, spacing, and typography in \`constants/Colors.ts\` and \`constants/Typography.ts\`.\n`;
  md += `5. **Component decomposition** — Split any file over 350 lines into smaller, single-responsibility components.\n\n`;
  md += `---\n\n`;

  md += `## 📄 Affected Files (${allFiles.length})\n\n`;
  if (!allFiles.length) { md += '_No files with detected issues._\n\n'; }
  else { allFiles.forEach(f => { md += `- \`${f}\`\n`; }); }
  md += '\n---\n\n';

  md += `## ✅ Frontend Test Cases\n\n`;
  testCases.forEach(tc => { md += `- [ ] ${tc}\n`; });
  md += '\n---\n\n';

  md += `## Final Status\n\n**${status}**\n\n`;
  md += `> Report generated by Frontend QA Agent.  \n`;
  md += `> Last run: ${TIMESTAMP}\n`;

  return md;
}

// ── MAIN ──
console.log('\n🔍 Frontend QA Agent — Maw3edak Mobile\n');
console.log('Scanning UI directories...\n');

let totalFiles = 0;
for (const dir of SCAN_DIRS) {
  const files = walkDir(path.join(ROOT, dir));
  totalFiles += files.length;
  console.log(`  📁 ${dir.padEnd(15)} ${files.length} files`);
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
console.log(`\n✅ Report → qa-agent/frontend/reports/frontend-report.md\n`);
