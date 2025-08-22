# Repository Rules

## Project Information
- **Framework**: Next.js with TypeScript
- **UI Library**: Tailwind CSS, Framer Motion
- **Database**: Supabase
- **Target Framework**: Playwright

## Testing Guidelines
- Use Playwright for E2E and integration tests
- Test files should be placed in `tests/` directory
- Follow naming convention: `*.spec.ts` for test files

## Architecture Notes
- Dashboard uses tab-based navigation with state management
- Components are organized in `/components` directory with separation of concerns
- Database interactions use Supabase client
- Wallet and withdrawal functionality are separate but related components