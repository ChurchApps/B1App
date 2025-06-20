# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B1 Church is a multi-tenant church management platform built with Next.js 15. It provides churches with a customizable website and mobile app featuring online giving, self-check-in, live streaming, member directory, and content management.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3301)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture

### Multi-Tenant System

- **Subdomain-based routing**: Each church accessed via subdomain (e.g., `churchname.b1.church`)
- **Dynamic route parameter**: `[sdSlug]` represents the subdomain/church identifier
- **Church configuration**: Loaded via `ConfigHelper.load(sdSlug)` which aggregates:
  - Church settings from MembershipApi
  - Appearance/theme configuration
  - Navigation links from ContentApi
  - Payment gateway settings
  - Global styles

### API Microservices

The application integrates with multiple backend services configured in `EnvironmentHelper`:

- **MembershipApi**: Church data, users, settings
- **ContentApi**: Pages, navigation, styles
- **GivingApi**: Donations, payment processing
- **AttendanceApi**: Check-in and attendance tracking
- **MessagingApi**: Communication features
- **DoingApi**: Tasks and workflows
- **LessonsApi**: Educational content

### Key Patterns

1. **Server Actions**: Cache clearing via `revalidateTag()` in `src/app/actions.ts`
2. **Configuration Loading**: Aggregated in `ConfigHelper.load()` with caching
3. **Authentication**: JWT-based with `UserContext` managing user state
4. **Dynamic Theming**: Church-specific styles loaded and applied via `<Theme>` component
5. **Page Generation**: Server-side rendered with metadata generation for SEO

### Directory Structure

- `/src/app/[sdSlug]/` - Main church routes
  - `admin/` - Administrative interfaces (site, video, calendar management)
  - `my/` - Member portal (timeline, donations, directory)
  - `groups/` - Group management features
  - `stream/` - Live streaming functionality
- `/src/components/` - Reusable components by feature area
- `/src/helpers/` - Utility functions and business logic
- `/src/services/` - API service layer

### Environment Configuration

Set up `.env` from `dotenv.sample.txt`:

- Staging: Use default values
- Production: Update API URLs to production endpoints

### TypeScript Configuration

- Strict mode enabled (except `strictNullChecks`)
- Path alias: `@/*` maps to `src/*`
- Target: ES6 with ESNext modules

## Testing & Development Workflow

1. Create test account at https://staging.b1.church/ for staging environment
2. Development guide available at https://churchapps.org/dev
3. Multi-language support with 12 locales
4. Progressive Web App capabilities configured in `public/manifest.json`

## Important Dependencies

- `@churchapps/apphelper` - Shared church app utilities
- Material-UI (MUI) - UI component framework
- React DnD - Drag-and-drop functionality for page builder
- React Big Calendar - Event calendar component

## Playwright Tests

- Use shared helper functions for recurring functionality such as logging in.
- Keep the tests as simple as possible
- Always run the tests to verify they work after changing them.
- Review relevant code to get exact field/button/link names instead of writing broad match rules.
- Delete any temporary screenshots and debug tests.
- Make sure tests run in headless mode when auto-running them.
