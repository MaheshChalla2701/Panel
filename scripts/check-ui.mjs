import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Isolated browser contexts: no account creation, login, or production writes.
await mkdir('test-results/ui', { recursive: true });
const browser = await chromium.launch();
const failures = [];
const routes = {
  'user-stu-1': ['/', '/badge-eligibility', '/book-interview', '/my-interviews', '/badge-status'],
  'user-int-1': ['/interviewer', '/interviewer/availability', '/interviewer/schedule', '/interviewer/evaluations', '/interviewer/workspace/intv-2'],
  'user-adm-1': ['/admin', '/admin/eligible-students', '/admin/interviews', '/admin/interviewers', '/admin/malpractice', '/admin/audit-logs'],
};
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 960 } });
    const page = await context.newPage();
    page.on('pageerror', (error) => failures.push(`${width}: ${error.message}`));
    await page.goto('http://127.0.0.1:5173');
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) failures.push(`${width}: sign-in overflow`);
    await page.screenshot({ path: `test-results/ui/signin-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'New student? Create an account' }).click();
    await page.getByRole('heading', { name: 'Create your account' }).waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) failures.push(`${width}: sign-up overflow`);
    await page.screenshot({ path: `test-results/ui/signup-${width}.png`, fullPage: true });
    await context.close();

    for (const [user, paths] of Object.entries(routes)) {
      const demo = await browser.newContext({ viewport: { width, height: 960 } });
      await demo.addInitScript((id) => localStorage.setItem('Panel_current_user_id', id), user);
      // Render existing demo screens with their fixture data, without changing app config.
      await demo.route('**/src/services/supabase/client.ts*', (route) => route.fulfill({
        contentType: 'application/javascript', body: 'export const supabase = null; export const isSupabaseConfigured = false;',
      }));
      const tab = await demo.newPage();
      tab.on('pageerror', (error) => failures.push(`${width} ${user}: ${error.message}`));
      for (const path of paths) {
        await tab.goto(`http://127.0.0.1:5173${path}`);
        await tab.locator('.workspace-content').waitFor();
        const overflow = await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        if (overflow) failures.push(`${width} ${path}: horizontal overflow`);
        await tab.screenshot({ path: `test-results/ui/${path.replaceAll('/', '-') || 'overview'}-${width}.png`, fullPage: true });
        console.log(`${width} ${path}: rendered${overflow ? ' OVERFLOW' : ''}`);
      }
      await demo.close();
    }
  }
} finally {
  await browser.close();
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('All 36 page/viewport checks passed. Screenshots: test-results/ui');
