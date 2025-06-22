# Test IDs Documentation

This file documents all data-testid attributes used in the application for testing purposes.

## Admin Section

### Blocks Admin (/admin/site/blocks)
- `add-block-button` - The add button in the blocks list header
- `blockDetailsBox` - The block creation/edit form container (ID attribute)

### Pages Admin (/admin/site)
- Consider adding: `add-page-button` - The add button in the pages list header

### Video Admin (/admin/video)
- Consider adding: `add-sermon-button` - The add button for creating sermons

## Best Practices

1. Always use kebab-case for test IDs (e.g., `add-block-button`)
2. Be descriptive but concise
3. Add test IDs to primary action buttons
4. Add test IDs to form containers
5. Document all test IDs in this file