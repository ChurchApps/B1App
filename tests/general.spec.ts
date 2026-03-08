import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-base';

// OCTAVIAN/OCTAVIUS are the names used for testing. If you see Octavian or Octavius entered anywhere, it is a result of these tests.
test.describe('General Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my/timeline');
    await page.waitForLoadState('domcontentloaded');
    const loginBtn = page.locator('[id="login-submit-button"]');
    await loginBtn.click();
    await page.waitForTimeout(500);
  });

  test.describe('Timeline', () => {
    test('UNFINISHED should send message on updates', async ({ page }) => {
      const firstItem = page.locator('[class="memberItem"]').first();
      await firstItem.click();
      const textbox = page.locator('[name="noteText"]').first();
      await textbox.fill('Octavian Test Message');
      const sendBtn = page.locator('button span').getByText('send').first();
      await sendBtn.click();
    });
  });

  test.describe('Giving', () => {
    test.beforeEach(async ({ page }) => {
      const directoryTab = page.locator('[data-testid="my-tab-give"]');
      await directoryTab.click();
      await page.waitForTimeout(500);
    });

    test.skip('UNFINSHED should add donation', async ({ page }) => {
      const donationTab = page.locator('[class="memberName"]').getByText('Give Now');
      await donationTab.click();
    });

    test('UNFINSHED should check donation history', async ({ page }) => {
      const historyTab = page.locator('[class="memberName"]').getByText('History');
      await historyTab.click();
    });

    test('UNFINSHED should check recurring donations', async ({ page }) => {
      const recurringTab = page.locator('[class="memberName"]').getByText('Recurring Donations');
      await recurringTab.click();
    });
  });

  test.describe('Groups', () => {
    test.beforeEach(async ({ page }) => {
      const directoryTab = page.locator('[data-testid="my-tab-my groups"]');
      await directoryTab.click();
      await page.waitForTimeout(2000);
      const praiseTeam = page.locator('div').getByText('Praise Team').first();
      await praiseTeam.click();
      await page.waitForTimeout(1000);
    });

    test('should view group details', async ({ page }) => {
      const details = page.locator('p').getByText('Contemporary worship team for Sunday services');
      await expect(details).toHaveCount(1);
    });

    test('should add group member', async ({ page }) => {
      const memTab = page.locator('[class="sideNav"] li a').getByText('Members');
      await memTab.click();

      const searchBar = page.locator('[name="personAddText"]');
      await searchBar.fill('Sarah Wilson');
      const searchBtn = page.locator('[data-testid="search-person-button"]');
      await searchBtn.click();
      const addBtn = page.locator('[data-testid="add-person-PER00000050-button"]');
      await addBtn.click();
      const validatedAddition = page.locator('[id="groupMembersBox"] td a').getByText('Sarah Wilson');
      await expect(validatedAddition).toHaveCount(1);
    });

    test('should remove group member', async ({ page }) => {
      const memTab = page.locator('[class="sideNav"] li a').getByText('Members');
      await memTab.click();

      const removeBtn = page.locator('button span').getByText('remove').last();
      await removeBtn.click();
      await page.waitForTimeout(500);
      const validatedRemoval = page.locator('[id="groupMembersBox"] td a').getByText('Sarah Wilson');
      await expect(validatedRemoval).toHaveCount(0);
    });

    test('should view member details', async ({ page }) => {
      const memTab = page.locator('[class="sideNav"] li a').getByText('Members');
      await memTab.click();
      await page.waitForTimeout(500);

      const firstMem = page.locator('[id="groupMembersBox"] td a').first();
      await firstMem.click();
      await page.waitForTimeout(500);
      const loginBtn = page.locator('[id="login-submit-button"]');
      await loginBtn.click();
      await page.waitForTimeout(500);
      const validatedPerson = page.locator('h2').getByText('Michael Davis');
      await expect(validatedPerson).toHaveCount(1);
      await expect(page).toHaveURL(/\/my\/community\/PER\d+/);
    });

    test('should add attendance session', async ({ page }) => {
      const attTab = page.locator('[class="sideNav"] li a').getByText('Attendance');
      await attTab.click();

      const addBtn = page.locator('[data-testid="add-service-time-button"]');
      await addBtn.click();
      const date = page.locator('input').last();
      await date.fill('2025-03-01');
      const saveBtn = page.locator('button').getByText('Save');
      await saveBtn.click();
      const sessions = page.locator('[role="combobox"]');
      await sessions.click();
      const validatedSession = page.locator('li').getByText('03/01/2025');
      await expect(validatedSession).toHaveCount(1);
    });

    test('should add person to session', async ({ page }) => {
      const attTab = page.locator('[class="sideNav"] li a').getByText('Attendance');
      await attTab.click();

      const sessions = page.locator('[role="combobox"]');
      await sessions.click();
      const session = page.locator('li').getByText('03/01/2025');
      await session.click();
      const addBtn = page.locator('button').getByText('Add').first();
      await addBtn.click();
      const validatedAddition = page.locator('[id="groupMemberTable"] td a').getByText('Michael Davis');
      await expect(validatedAddition).toHaveCount(1);
    });

    test('should remove person from session', async ({ page }) => {
      const attTab = page.locator('[class="sideNav"] li a').getByText('Attendance');
      await attTab.click();

      const sessions = page.locator('[role="combobox"]');
      await sessions.click();
      const session = page.locator('li').getByText('03/01/2025');
      await session.click();
      const removeBtn = page.locator('button').getByText('Remove').first();
      await removeBtn.click();
      const validatedRemoval = page.locator('[id="groupMemberTable"] td a').getByText('Michael Davis');
      await expect(validatedRemoval).toHaveCount(0);
    });

    test('should add event to calendar', async ({ page }) => {
      const calendarTab = page.locator('[class="sideNav"] li a').getByText('Calendar');
      await calendarTab.click();

      const addBtn = page.locator('[data-testid="event-add-button"]');
      await addBtn.click();
      const recurring = page.locator('[name="recurring"]');
      await recurring.click();
      const startDate = page.locator('[name="start"]');
      await startDate.fill('2025-03-01T13:00');
      const endDate = page.locator('[name="end"]');
      await endDate.fill('2025-03-01T15:00');
      const frequency = page.locator('[id="mui-component-select-freq"]');
      await frequency.click();
      const week = page.locator('li').getByText('Week');
      await week.click();
      const title = page.locator('[name="title"]');
      await title.fill('Octavian Test Event');
      const notes = page.locator('[role="textbox"]');
      await notes.fill('Playwright testing event, feel free to delete');
      const saveBtn = page.locator('[data-testid="save-event-button"]');
      await saveBtn.click();

      const validatedEvent = page.locator('[title="Octavian Test Event"]').first();
      await expect(validatedEvent).toHaveCount(1);
    });

    test('should edit calendar event', async ({ page }) => {
      const calendarTab = page.locator('[class="sideNav"] li a').getByText('Calendar');
      await calendarTab.click();

      const event = page.locator('[title="Octavian Test Event"]').first();
      await event.click();
      const editBtn = page.locator('[data-testid="event-edit-button"]').first();
      await editBtn.click();
      const title = page.locator('[name="title"]');
      await title.fill('Octavius Test Event');
      const saveBtn = page.locator('[data-testid="save-event-button"]');
      await saveBtn.click();
      const selectAll = page.locator('[value="all"]');
      await selectAll.click();
      const confirmSave = page.locator('[data-testid="edit-recurring-save-button"]');
      await confirmSave.click();
      const validatedEdit = page.locator('[title="Octavius Test Event"]').first();
      await expect(validatedEdit).toHaveCount(1);
    });

    test('should remove event from calendar', async ({ page }) => {
      const calendarTab = page.locator('[class="sideNav"] li a').getByText('Calendar');
      await calendarTab.click();

      const event = page.locator('[title="Octavius Test Event"]').first();
      await event.click();
      const editBtn = page.locator('[data-testid="event-edit-button"]').first();
      await editBtn.click();
      const deleteBtn = page.locator('[data-testid="delete-event-button"]');
      await deleteBtn.click();
      const selectAll = page.locator('[value="all"]');
      await selectAll.click();
      const confirmDelete = page.locator('[data-testid="edit-recurring-save-button"]');
      await confirmDelete.click();
      const validatedEdit = page.locator('[title="Octavius Test Event"]').first();
      await expect(validatedEdit).toHaveCount(0);
    });

    test('should send conversation message', async ({ page }) => {
      const convoTab = page.locator('[class="sideNav"] li a').getByText('Conversations');
      await convoTab.click();

      const messageBox = page.locator('[name="noteText"]');
      await messageBox.fill('Octavian Test Message');
      const sendBtn = page.locator('button span').getByText('send');
      await sendBtn.click();
      const validatedMessage = page.locator('p').getByText('Octavian Test Message');
      await expect(validatedMessage).toHaveCount(1);
    });

    test('should edit conversation message', async ({ page }) => {
      const convoTab = page.locator('[class="sideNav"] li a').getByText('Conversations');
      await convoTab.click();

      const editBtn = page.locator('button span').getByText('edit');
      await editBtn.click();
      const messageBox = page.locator('[name="noteText"]');
      await messageBox.fill('Octavius Test Message');
      const sendBtn = page.locator('button span').getByText('send');
      await sendBtn.click();
      const validatedEdit = page.locator('p').getByText('Octavius Test Message');
      await expect(validatedEdit).toHaveCount(1);
      const oldMessage = page.locator('p').getByText('Octavian Test Message');
      await expect(oldMessage).toHaveCount(0);
    });

    test('should delete conversation message', async ({ page }) => {
      const convoTab = page.locator('[class="sideNav"] li a').getByText('Conversations');
      await convoTab.click();

      const editBtn = page.locator('button span').getByText('edit').first();
      await editBtn.click();
      const deleteBtn = page.locator('button span').getByText('delete').first();
      await deleteBtn.click();
      const validatedDeletion = page.locator('p').getByText('Octavius Test Message');
      await expect(validatedDeletion).toHaveCount(0);
    });
  });

  test.describe('Directory', () => {
    test.beforeEach(async ({ page }) => {
      const directoryTab = page.locator('[data-testid="my-tab-directory"]');
      await directoryTab.click();
      await page.waitForTimeout(500);
    });

    test('should search for person', async ({ page }) => {
      const searchBar = page.locator('[class="masterSearch"] input');
      await searchBar.fill('Mary');
      const searchBtn = page.locator('[class="masterSearch"] button');
      await searchBtn.click();
      await page.waitForTimeout(500);
      const searchResult = page.locator('[class="memberName"]').first();
      await searchResult.click();
      await page.waitForTimeout(500);
      const validatedResult = page.locator('h3').getByText('Mary Smith');
      await expect(validatedResult).toHaveCount(1);
    });

    test('UNFINISHED should message person', async ({ page }) => {
      const firstPerson = page.locator('[class="memberName"]').first();
      await firstPerson.click();
      await page.waitForTimeout(500);

      const messageBtn = page.locator('button').getByText('Message');
      await messageBtn.click();
      const messageBox = page.locator('[name="noteText"]');
      await messageBox.fill('Octavian Test Message');
      const sendBtn = page.locator('button span').getByText('send');
      await sendBtn.click();
    });

    test('should search for group member', async ({ page }) => {
      const groupTab = page.locator('[class="filterBtn"]').getByText('Groups');
      await groupTab.click();
      const searchBar = page.locator('[role="combobox"]');
      await searchBar.click();
      const group = page.locator('[data-value="GRP00000019"]');
      await group.click();
      const searchBtn = page.locator('[class="masterSearch"] button');
      await searchBtn.click();
      await page.waitForTimeout(500);
      const searchResult = page.locator('[class="memberName"]').first();
      await searchResult.click();
      await page.waitForTimeout(500);
      const validatedResult = page.locator('h3').getByText('Emily Davis');
      await expect(validatedResult).toHaveCount(1);
    });
  });

  test.describe('Serving', () => {
    test.beforeEach(async ({ page }) => {
      const directoryTab = page.locator('[data-testid="my-tab-serving"]');
      await directoryTab.click();
      await page.waitForTimeout(500);
    });

    test('should add blockout dates', async ({ page }) => {
      const blockout = page.locator('[class="memberName"]').getByText('Blockout Dates');
      await blockout.click();
      const addBtn = page.locator('button span').getByText('add');
      await addBtn.click();
      const startDate = page.locator('[name="startDate"]');
      await startDate.fill('2025-03-01');
      const endDate = page.locator('[name="endDate"]');
      await endDate.fill('2025-03-10');
      const saveBtn = page.locator('button').getByText('save');
      await saveBtn.click();
      const validatedStart = page.locator('table td').getByText('Mar 1, 2025');
      await expect(validatedStart).toHaveCount(1);
      const validatedEnd = page.locator('table td').getByText('Mar 10, 2025');
      await expect(validatedEnd).toHaveCount(1);
    });

    test('should edit blockout dates', async ({ page }) => {
      const blockout = page.locator('[class="memberName"]').getByText('Blockout Dates');
      await blockout.click();
      const editBtn = page.locator('button span').getByText('edit').last();
      await editBtn.click();
      const startDate = page.locator('[name="startDate"]');
      await startDate.fill('2025-04-01');
      const endDate = page.locator('[name="endDate"]');
      await endDate.fill('2025-04-10');
      const saveBtn = page.locator('button').getByText('save');
      await saveBtn.click();
      const validatedStart = page.locator('table td').getByText('Apr 1, 2025');
      await expect(validatedStart).toHaveCount(1);
      const validatedEnd = page.locator('table td').getByText('Apr 10, 2025');
      await expect(validatedEnd).toHaveCount(1);
    });

    test('should cancel editing blockout dates', async ({ page }) => {
      const blockout = page.locator('[class="memberName"]').getByText('Blockout Dates');
      await blockout.click();
      const editBtn = page.locator('button span').getByText('edit').last();
      await editBtn.click();
      const startDate = page.locator('[name="startDate"]');
      await expect(startDate).toHaveCount(1);
      const cancelBtn = page.locator('button').getByText('Cancel');
      await cancelBtn.click();
      await expect(startDate).toHaveCount(0);
    });

    test('should delete blockout dates', async ({ page }) => {
      const blockout = page.locator('[class="memberName"]').getByText('Blockout Dates');
      await blockout.click();
      const editBtn = page.locator('button span').getByText('edit').last();
      await editBtn.click();
      await page.waitForTimeout(300)
      const deleteBtn = page.locator('[id="delete"]');
      await deleteBtn.click();
      const validatedStart = page.locator('table td').getByText('Apr 1, 2025');
      await expect(validatedStart).toHaveCount(0);
      const validatedEnd = page.locator('table td').getByText('Apr 10, 2025');
      await expect(validatedEnd).toHaveCount(0);
    });

    test('should view/verify serving time details', async ({ page, context }) => {
      const servTime = page.locator('[class="memberName"]').getByText('Upcoming Worship Schedule');
      await servTime.click();
      await page.waitForTimeout(500);
      const verifiedServTime = page.locator('h1').getByText('Upcoming Worship Schedule');
      await expect(verifiedServTime).toHaveCount(1);
      const expectedRole = page.locator('[id="input-box-title"]').getByText('Position: Sound Tech');
      await expect(expectedRole).toHaveCount(1);
      const expectedResponse = page.locator('div').getByText('Status: Accepted');
      await expect(expectedResponse).toHaveCount(1);
      const techTeam = page.locator('[data-testid="team-technical-display-box"] a').getByText('Demo User');
      await expect(techTeam).toHaveCount(1);
      const worshipTeam = page.locator('[data-testid="team-worship-display-box"] a').getByText('David Lopez');
      await expect(worshipTeam).toHaveCount(1);

      const countdownVid = page.locator('div a').getByText('Countdown Video');
      await countdownVid.click();
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        countdownVid.click()
      ]);
      await newPage.waitForLoadState();
      await page.waitForTimeout(5000);
      await expect(newPage).toHaveURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    });
  });

  test.describe('Check In', () => {
    test.beforeEach(async ({ page }) => {
      const checkInTab = page.locator('[data-testid="my-tab-check-in"]');
      await checkInTab.click();
      await page.waitForTimeout(500);
    });
    test('should check self in', async ({ page }) => {
      const sundayMorning = page.locator('button div h6').getByText('Sunday Morning Service');
      await sundayMorning.click();
      const demoUser = page.locator('button div h6').getByText('Demo User');
      await demoUser.click();
      const earlyServ = page.locator('button').getByText('Select Group').last();
      await earlyServ.click();
      const sundaySchool = page.locator('button div p').getByText('Sunday School');
      await sundaySchool.click();
      const adultBible = page.locator('button div p').getByText('Adult Bible Class');
      await adultBible.click();
      const checkInBtn = page.locator('[data-testid="checkin-submit-button"]');
      await checkInBtn.click();
      const validatedCheckIn = page.locator('h4').getByText('Check-in Complete');
      await expect(validatedCheckIn).toHaveCount(1);

      //double check
      const returnBtn = page.locator('button').getByText('Back to My Page');
      await returnBtn.click();
      await page.waitForTimeout(500);
      const checkInTab = page.locator('[data-testid="my-tab-check-in"]');
      await checkInTab.click();
      await page.waitForTimeout(500);
      await sundayMorning.click();
      await page.waitForTimeout(500);
      const validationChip = page.locator('div span').getByText('Adult Bible Class');
      await expect(validationChip).toHaveCount(1);
    });
  });
});