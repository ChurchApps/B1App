# B1 Church Playwright Test Suite

This directory contains the Playwright end-to-end tests for the B1 Church application.

## Test Files

### `auth.spec.ts`
Tests authentication functionality:
- Login form validation
- Successful login flow
- Logout functionality
- Protected route redirects

### `admin.spec.ts`
Tests admin access:
- Admin page permission checks
- Admin site page access

### `navigation.spec.ts`
Tests navigation features:
- Public page accessibility
- Header navigation
- Mobile responsive menu
- Member portal navigation
- User menu functionality

### `helpers/test-base.ts`
Shared test utilities and fixtures:
- Common selectors organized by feature
- `authenticatedPage` fixture for tests requiring login
- Helper functions for common operations
- Browser state management

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/login.spec.ts

# Run tests in headed mode (with browser UI)
npx playwright test --headed

# Run tests with detailed reporter
npx playwright test --reporter=list

# Run tests in specific browser
npx playwright test --project=chromium
```

## Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `https://grace.demo.b1.church`
- Default timeout: 30 seconds
- Parallel execution enabled
- Browser state cleared between tests
- Service workers blocked to prevent caching
- Screenshots on failure, traces on failure
- Headless mode by default

## Test User

The tests use the demo environment credentials:
- Email: `demo@chums.org`
- Password: `password`

## Performance Optimizations

- Tests run in parallel for faster execution
- Shared test utilities reduce code duplication
- `authenticatedPage` fixture handles login once per test
- Minimal wait times using `domcontentloaded` instead of `networkidle`
- Browser cache and storage cleared between tests