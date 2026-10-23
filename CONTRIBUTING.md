# Contributing Guidelines

Thank you for your interest in contributing to this project! This document provides guidelines for code style, structure, and best practices.

## Code Style

### Vue Components

- Use PascalCase for component filenames: `ComponentName.vue`
- Use single-file components (SFC) with `<script setup>` syntax
- Keep template, script, and style sections clearly separated
- Use proper indentation (2 spaces)

### TypeScript

- Enable strict type checking (`"strict": true` in tsconfig.json)
- Use interfaces for API responses and state management
- Avoid `any` type - use explicit types or generics
- Place type definitions near where they're used

### Component Organization

- **Views**: Page-level components in `src/views/` (e.g., Home.vue, Chat.vue)
- **Components**: Reusable UI elements in `src/components/`
  - `common/`: Generic components (buttons, inputs, etc.)
  - `layout/`: Layout wrappers (headers, footers, navigation)
  - `scraper/`: Domain-specific scraper components
  - `ui/`: Radix/Vue UI primitives
- **Composables**: Vue composables in `src/composables/` for custom logic hooks

### Naming Conventions

- **Components**: PascalCase (`ChatWidget.vue`, `Button.vue`)
- **Composables**: camelCase (`useUserStore.ts`, `useApiFetch.ts`)
- **Functions/Variables**: camelCase (`getUserData()`, `userList`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRY_COUNT`)

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for code style changes (formatting, etc.)
- `refactor:` for code refactoring
- `test:` for adding/updating tests
- `chore:` for maintenance tasks

### Testing

- Write unit tests using Vitest
- Test components in isolation
- Mock API calls when necessary
- Aim for 80%+ test coverage

## Project Structure

```
src/
├── assets/              # Static assets (images, fonts)
├── components/          # Reusable UI components
│   ├── common/          # Generic components
│   ├── layout/          # Layout components
│   └── ui/              # Radix/Vue UI primitives
├── composables/         # Vue composables
├── config/              # Configuration files
├── lib/                 # Utility functions
├── router/              # Routing configuration
├── stores/              # Pinia state management
├── types/               # TypeScript interfaces
├── views/               # Page-level components
└── App.vue              # Root component
```

## Best Practices

1. **Separation of Concerns**: Keep business logic out of components, use composables and stores
2. **Reusability**: Extract reusable logic into composables or utility functions
3. **Type Safety**: Use TypeScript interfaces for all API responses and state
4. **Error Handling**: Implement proper error boundaries and user feedback
5. **Accessibility**: Follow WCAG guidelines for accessible components
6. **Performance**: Lazy-load routes when possible, avoid unnecessary re-renders

## Questions?

If you have any questions or need clarification, please open an issue or reach out to the maintainers.
