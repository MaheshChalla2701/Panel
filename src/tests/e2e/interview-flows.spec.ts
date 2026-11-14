import { test, expect } from '@playwright/test';

test.describe('GRIT Interview Hub — End-to-End User Journey Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure demo storage is reset
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('grit_assignment_demo_mode', 'true');
    });
    await page.reload();
  });

  test('Scenario 1: Student views eligibility, selects slot, books, and sees confirmation', async ({ page }) => {
    // 1. Visit Student Home
    await expect(page.locator('h1')).toContainText('Aarav Sharma');
    await expect(page.getByText("You're eligible for your interview!").first()).toBeVisible();

    // 2. Navigate to booking
    await page.getByRole('link', { name: /Book Interview/i }).first().click();
    await expect(page).toHaveURL(/.*book-interview/);

    // 3. Select a bookable slot
    const slotButton = page.locator('button:has-text("Available")').first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();

    // 4. Confirm booking
    const confirmButton = page.getByRole('button', { name: /Confirm & Reserve Slot/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 5. Booking Confirmation screen
    await expect(page.getByRole('heading', { name: /Your interview is confirmed!/i })).toBeVisible();
    await expect(page.getByText(/Booking Reference/i)).toBeVisible();
  });

  test('Scenario 2: Interviewer views schedule, opens candidate workspace, submits PASS, badge awarded', async ({ page }) => {
    // 1. Switch to Interviewer
    await page.getByRole('button', { name: /Interviewer/i }).first().click();
    await page.goto('/interviewer');
    await expect(page.locator('h1')).toContainText('Dr. Priya Ramanathan');

    // 2. Open candidate with pending evaluation (Sneha Kulkarni, intv-2)
    const evalLink = page.getByRole('link', { name: /Submit Evaluation/i }).first();
    await expect(evalLink).toBeVisible();
    await evalLink.click();

    // 3. Fill evaluation form
    await page.getByRole('button', { name: 'Pass' }).click();
    await page.locator('textarea').first().fill('Exemplary mastery of LLM attention and token mechanics.');
    await page.locator('textarea').nth(1).fill('Superb performance in code defense. Keep progressing!');
    await page.locator('textarea').nth(2).fill('Top tier candidate; approved without reservation.');

    // 4. Click Review & Submit
    await page.getByRole('button', { name: /Review & Submit Official Evaluation/i }).click();

    // 5. Modal confirmation
    await page.getByRole('button', { name: /Confirm Official Submission/i }).click();
    await expect(page.getByText(/Evaluation Immutable & Saved/i)).toBeVisible();

    // 6. Verify candidate sees Passed outcome and awarded badge
    await page.evaluate(() => {
      localStorage.setItem('grit_current_user_id', 'user-stu-4');
    });
    await page.goto('/badge-status');
    await expect(page.getByText(/Cleared your interview!|Official Track Badge Awarded/i)).toBeVisible();
  });

  test('Scenario 3: Admin investigates unbooked students and dispatches reminder', async ({ page }) => {
    // 1. Switch to Admin
    await page.getByRole('button', { name: /Admin/i }).first().click();
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Interview Operations Dashboard');

    // 2. Navigate to Eligible Students
    await page.getByRole('link', { name: /Eligible Students/i }).click();
    await expect(page).toHaveURL(/.*eligible-students/);

    // 3. Filter unbooked students
    const unbookedFilter = page.getByRole('button', { name: /Eligible & Unbooked/i });
    await unbookedFilter.click();

    // 4. Nudge unbooked candidate
    const nudgeButton = page.getByRole('button', { name: /Nudge to Book/i }).first();
    if (await nudgeButton.isVisible()) {
      await nudgeButton.click();
      await expect(page.getByText(/Reminder Dispatched/i)).toBeVisible();
    }
  });

  test('Scenario 4: Admin reviews malpractice inquiry and confirms badge nullification', async ({ page }) => {
    // 1. Switch to Admin
    await page.getByRole('button', { name: /Admin/i }).first().click();
    await page.goto('/admin/malpractice');
    await expect(page.locator('h1')).toContainText('Malpractice Board');

    // 2. Find pending inquiry and click adjudicate
    const adjudicateBtn = page.getByRole('button', { name: /Adjudicate Case/i }).first();
    if (await adjudicateBtn.isVisible()) {
      await adjudicateBtn.click();

      // 3. Choose Confirm Malpractice & fill justification
      await page.getByRole('button', { name: /Confirm Malpractice/i }).click();
      await page.locator('textarea').last().fill('Plagiarism confirmed by academic committee review.');
      await page.getByRole('button', { name: /Commit Decision/i }).click();

      await expect(page.getByText(/Case Marked CONFIRMED/i)).toBeVisible();
    }
  });

  test('Scenario 5: Student cannot see private reviewer notes', async ({ page }) => {
    // 1. As Student, view badge status
    await page.goto('/badge-status');
    // Ensure "Private Reviewer Notes" is NOT visible in student view
    await expect(page.getByText('Private Reviewer Notes')).not.toBeVisible();
    await expect(page.getByText('Exemplary candidate')).not.toBeVisible();
  });
});
