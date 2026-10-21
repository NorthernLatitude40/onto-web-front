# Technical Architecture Documentation

## Overview

This project is a Vue 3 + TypeScript application built with Vite. It follows modern frontend architecture principles with clear separation of concerns and type safety throughout.

## Core Technologies

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix Vue primitives

## Architecture Layers

### 1. Presentation Layer (Views & Components)

**Location**: `src/views/` and `src/components/`

**Purpose**: User interface and interaction handling.

**Structure**:

```
src/views/
├── Home.vue             # Main landing page
├── Chat.vue             # Chat interface
└── ScraperConfig.vue    # Configuration editor

src/components/
├── common/              # Generic UI components (buttons, inputs)
├── layout/              # Layout wrappers (headers, footers)
├── scraper/             # Domain-specific scraper components
└── ui/                  # Radix/Vue UI primitives
```

**Responsibilities**:

- Render UI based on state
- Handle user interactions
- Delegate business logic to composables/stores
- Display data from state management

### 2. Business Logic Layer (Composables & Stores)

**Location**: `src/composables/` and `src/stores/`

**Purpose**: Application business logic and state management.

**Structure**:

```
src/composables/
├── useApiFetch.ts       # API data fetching
└── useUserAuth.ts       # Authentication logic

src/stores/
└── counter.ts          # Pinia store example
```

**Responsibilities**:

- Encapsulate business rules
- Manage application state (Pinia stores)
- Provide reusable logic hooks (composables)
- Handle side effects (API calls, mutations)

### 3. Data Layer (API & Services)

**Location**: `src/api/` and `src/service/`

**Purpose**: Data access and API communication.

**Structure**:

```
src/api/
├── user.ts             # User-related API calls
└── vehicles.ts         # Vehicle data API

src/service/
└── request.ts          # HTTP client configuration
```

**Responsibilities**:

- Define API endpoints and contracts
- Handle HTTP requests/responses
- Transform data to/from domain models
- Error handling and retries

### 4. Utility Layer (lib/)

**Location**: `src/lib/`

**Purpose**: Reusable utility functions.

**Structure**:

```
src/lib/
└── utils.ts            # General utilities
```

**Responsibilities**:

- Pure functions without side effects
- String manipulation, date formatting
- Validation helpers
- Math operations

## State Management

### Pinia Stores

The application uses [Pinia](https://pinia.es/) for state management:

```typescript
// Example store structure
const useCounterStore = defineStore("counter", {
  state: () => ({
    count: 0,
    name: "Eduardo",
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++;
    },
  },
});
```

**Best Practices**:

- Keep stores focused on specific domains
- Use getters for computed values
- Use actions for mutations and side effects
- Avoid direct state modification outside actions

## Routing

### Vue Router Configuration

**Location**: `src/router/index.ts`

**Structure**:

```typescript
const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/chat",
    name: "Chat",
    component: Chat,
  },
  {
    path: "/scraper-config",
    name: "ScraperConfig",
    component: ScraperConfig,
  },
];
```

**Features**:

- Nested routes for complex layouts
- Route-based code splitting (lazy loading)
- Navigation guards for authentication
- Dynamic route parameters

## Type Safety

### TypeScript Integration

**Key Principles**:

1. **Strict Mode**: All TypeScript configuration uses `"strict": true`
2. **Interfaces**: Define types for all API responses and state
3. **Generics**: Use when working with collections or flexible data structures
4. **Type Guards**: Validate runtime types when necessary

**Example**:

```typescript
// In src/types/vehicle.ts
interface VehicleConfig {
  id?: string;
  name: string;
  cron_schedule: string;
  user_agent: string;
  concurrency: number;
  timeout: number;
  proxy: string;
  target_url: string;
}
```

## API Design

### HTTP Client

**Location**: `src/service/request.ts`

**Features**:

- Axios-based HTTP client
- Request/response interceptors
- Base URL configuration
- Error handling middleware
- Request timeout configuration

### API Services

**Example Structure**:

```typescript
// src/api/vehicles.ts
export const getVehicles = async (): Promise<VehicleConfig[]> => {
  const response = await request.get("/api/vehicles");
  return response.data;
};
```

**Best Practices**:

- One service file per domain/resource
- Use descriptive function names
- Include proper TypeScript return types
- Handle errors appropriately

## Build Process

### Development

```bash
npm run dev
```

Starts Vite development server with:

- Hot Module Replacement (HMR)
- Source code error overlay
- Fast build times

### Production

```bash
npm run build
```

Creates optimized production build with:

- Code splitting
- Minification
- Tree-shaking
- Type checking

### Type Checking

```bash
npm run type-check
```

Runs TypeScript compiler in noEmit mode to catch type errors.

## Deployment

The application is configured for deployment as a static site. The build output can be served by any static file server or CDN.

### Environment Variables

Configured in `src/config/env.ts`:

```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.example.com";
```

Prefix all environment variables with `VITE_` to make them available in the client.

## Testing Strategy

### Unit Tests

- Location: `src/__tests__/` (or alongside components)
- Framework: Vitest
- Coverage: Aim for 80%+

### Integration Tests

- Test component interactions
- Mock API calls when necessary
- Verify state management behavior

### E2E Tests

- Location: `e2e/` (if configured)
- Framework: Cypress or Playwright
- Test user flows end-to-end

## Performance Optimization

1. **Code Splitting**: Lazy-load routes and heavy components
2. **Image Optimization**: Use modern formats (WebP, AVIF)
3. **Bundle Analysis**: Monitor bundle size with `npm run build -- --analyze`
4. **Memoization**: Cache expensive computations
5. **Virtual Scrolling**: For large lists

## Security Considerations

1. **XSS Protection**: Use Vue's text content escaping
2. **CSRF Protection**: Include CSRF tokens in API requests
3. **CORS**: Configure proper CORS headers on backend
4. **Input Validation**: Validate all user inputs and API responses
5. **Secret Management**: Never commit secrets to version control

## Migration Path

When adding new features or refactoring existing code:

1. **Backward Compatibility**: Maintain API compatibility when possible
2. **Deprecation Strategy**: Mark old APIs as deprecated before removal
3. **Feature Flags**: Use feature flags for experimental features
4. **Documentation**: Update documentation before releasing changes
5. **Testing**: Ensure comprehensive test coverage for new code

## Troubleshooting

### Common Issues

**TypeScript Errors**:

- Run `npm run type-check` to identify type issues
- Check interface definitions in `src/types/`

**Build Failures**:

- Clear cache with `npm run build -- --force`
- Delete `node_modules` and reinstall dependencies

**Runtime Errors**:

- Check browser console for detailed error messages
- Verify API responses match expected types

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Pinia Documentation](https://pinia.es/)
- [Vite Guide](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
