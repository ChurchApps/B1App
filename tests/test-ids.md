# Comprehensive Data-TestID Reference

This document contains all data-testid attributes found in the B1 Church codebase, organized by category for Playwright testing.

## Authentication & User Management

### Login & User Menu
- `login-chip` - Login button chip in header
- `user-menu-chip` - User menu dropdown trigger
- `member-portal-menu-item` - Member portal option in user menu
- `admin-portal-menu-item` - Admin portal option in user menu
- `edit-profile-menu-item` - Edit profile option in user menu
- `logout-menu-item` - Logout option in user menu
- `member-portal-list-item` - Member portal in mobile menu
- `admin-portal-list-item` - Admin portal in mobile menu
- `edit-profile-list-item` - Edit profile in mobile menu
- `logout-list-item` - Logout in mobile menu

## Navigation & Header

### Header & Mobile Navigation
- `admin-site-header` - Admin site header component
- `header-logo-link` - Logo link in header
- `header-logo` - Logo image element
- `mobile-menu-button` - Mobile hamburger menu button
- `close-drawer-button` - Close mobile drawer button

### Main Navigation
- `nav-item-{text}` - Navigation items (text converted to lowercase with dashes)
- `main-nav-{text}` - Main navigation items
- `expand-main-{text}` - Expand main menu items
- `expand-submenu-{text}` - Expand submenu items
- `edit-nav-link-{id}` - Edit navigation link by ID

### Navigation Admin
- `nav-link-edit-modal` - Navigation link edit modal
- `show-login-switch` - Toggle login button visibility
- `add-navigation-link` - Add new navigation link button

## Admin Components

### Blocks Admin
- `add-block-button` - Add new block button
- `block-name-input` - Block name input field
- `block-type-select` - Block type dropdown
- `block-type-element` - Element block type option
- `block-type-section` - Section block type option

### Pages Admin
- `page-edit-box` - Page edit container
- `page-errors` - Page validation errors
- `page-title-input` - Page title input
- `edit-url-button` - Edit URL path button
- `check-url-button` - Check URL validity button
- `page-url-input` - Page URL path input
- `page-layout-select` - Page layout dropdown
- `page-template-select` - Page template dropdown
- `duplicate-page-link` - Duplicate page link

### Video/Sermons Admin
- `sermons-display-box` - Sermons main container
- `sermons-loading` - Sermons loading indicator
- `add-sermon-menu-button` - Add sermon menu button
- `add-sermon-item` - Add sermon menu item
- `add-live-url-item` - Add permanent live URL item
- `edit-sermon-{id}` - Edit sermon by ID

#### Sermon Edit Form
- `sermon-edit-box` - Sermon edit container
- `sermon-edit-loading` - Sermon edit loading
- `sermon-errors` - Sermon validation errors
- `sermon-playlist-select` - Playlist selection dropdown
- `video-provider-select` - Video provider dropdown
- `video-data-input` - Video ID/URL input
- `publish-date-input` - Publish date input
- `edit-thumbnail-link` - Edit sermon thumbnail
- `sermon-thumbnail` - Sermon thumbnail image
- `sermon-title-input` - Sermon title input
- `sermon-description-input` - Sermon description textarea
- `add-to-playlist-link` - Add to another playlist link
- `add-to-playlist-button` - Add to playlist button
- `additional-playlist-select` - Additional playlist dropdown
- `share-sermon-button` - Share sermon button
- `fetch-youtube-button` - Fetch YouTube video details
- `fetch-vimeo-button` - Fetch Vimeo video details
- `playlist-option-{id}` - Playlist options by ID
- `additional-playlist-option-{id}` - Additional playlist options

### Calendar Admin
- `calendar-edit-box` - Calendar edit container
- `calendar-errors` - Calendar validation errors
- `calendar-name-input` - Calendar name input

### Site Admin
- `add-navigation-link` - Add navigation link button
- `show-login-switch` - Show login toggle switch

### Color Picker
- `color-option-{index}` - Color selection options by index
- `color-input` - Color value input field

### Link Edit
- `link-text-input` - Link display text input
- `link-url-input` - Link URL input
- `submenu-toggle-{id}` - Submenu toggle buttons by ID

## Member Portal (My Section)

### Navigation Tabs
- `my-portal-tabs` - Member portal tabs container
- `my-tab-timeline` - Timeline tab
- `my-tab-groups` - Groups tab
- `my-tab-community` - Community tab
- `my-tab-plans` - Plans tab
- `my-tab-checkin` - Check-in tab
- `my-tab-lessons` - Lessons tab
- `my-tab-donations` - Donations tab

### Directory/Community
- `directory-search-box` - Directory search container
- `search-people-chip` - Search by people chip
- `search-group-chip` - Search by group chip
- `directory-search-button` - Directory search button
- `directory-name-search-input` - Name search input
- `directory-group-select` - Group selection dropdown
- `group-option-{id}` - Group options by ID
- `directory-search-results` - Search results container

### Donations
- `donations-loading` - Donations loading indicator
- `payment-methods-loading` - Payment methods loading
- `donation-form` - Donation form component
- `donations-display-box` - Donations history container
- `recurring-donations` - Recurring donations component
- `payment-methods` - Payment methods component
- `donation-download-button` - Download donation records
- `export-current-year-csv` - Export current year CSV
- `print-current-year` - Print current year button
- `export-last-year-csv` - Export last year CSV
- `print-last-year` - Print last year button
- `current-year-export-link` - Current year export link
- `last-year-export-link` - Last year export link
- `print-current-year-button` - Print current year button
- `print-last-year-button` - Print last year button

## UI Components

### Button Links
- `button-link-{id}` - Button link elements by ID

### Chat
- `chat-message-input` - Chat message input field
- `emoji-button` - Emoji picker button
- `send-message-button` - Send message button

### Element Types
- `donate-link-{id}` - Donate link elements by ID

## Form Components

### Group Management
- Various group-related test IDs for contact forms, member management, etc.

### Event Calendar
- Calendar and event management test IDs

## Test Infrastructure

### From Test Files
The following test IDs are referenced in existing Playwright tests:

#### Admin Blocks Tests
- `add-block-button` - Used in admin-blocks.ts
- Block type selection elements
- Block name inputs

#### My Donations Tests
- `donations-loading` - Loading indicators
- `payment-methods-loading` - Payment method loading
- Various donation form elements

#### Admin Video Tests
- Sermon creation and editing elements
- Playlist management elements
- Stream settings components

## Usage Guidelines

1. **Naming Convention**: Use kebab-case (lowercase with dashes)
2. **Specificity**: Include IDs or unique identifiers when multiple similar elements exist
3. **Consistency**: Use consistent patterns across similar components
4. **Context**: Include component context in the name when helpful

## Example Usage in Playwright Tests

```typescript
// Login flow
await page.locator('[data-testid="login-chip"]').click();

// Navigation
await page.locator('[data-testid="admin-portal-menu-item"]').click();

// Admin actions
await page.locator('[data-testid="add-block-button"]').click();
await page.locator('[data-testid="block-name-input"]').fill('Test Block');

// Forms
await page.locator('[data-testid="sermon-title-input"]').fill('Test Sermon');
await page.locator('[data-testid="video-provider-select"]').selectOption('youtube');
```

## Missing Test IDs

Areas that may need additional data-testid attributes:
1. Form validation error messages
2. Success/confirmation messages
3. Loading states for specific components
4. Table row actions (edit, delete buttons)
5. Modal dialog elements
6. Drag and drop interface elements
7. File upload components

This reference should be updated as new data-testid attributes are added to the codebase.