# Vue 3 + TypeScript + Vite - Scraper Configuration Platform

A web application for configuring and managing web scrapers with a user-friendly interface.

## Features

- **Scraper Configuration**: Create and manage web scraping tasks
- **Chat Interface**: Interactive AI assistant for help and guidance
- **Real-time Monitoring**: Track scraper execution status and results
- **Data Export**: Download scraped data in various formats

## Project Structure

```
src/
├── assets/              # Static assets (images, fonts)
├── components/          # Reusable UI components
│   ├── common/          # Generic components (buttons, inputs)
│   ├── layout/          # Layout wrappers (headers, footers)
│   ├── scraper/         # Domain-specific scraper components
│   └── ui/              # Radix/Vue UI primitives
├── composables/         # Vue composables (custom logic hooks)
├── config/              # Configuration files
├── lib/                 # Utility functions and helpers
├── router/              # Routing configuration
├── stores/              # Pinia state management
├── types/               # TypeScript type definitions
└── views/               # Page-level components (routes)
    ├── Home.vue         # Main landing page
    ├── Chat.vue         # Chat interface
    └── ScraperConfig.vue # Configuration editor
```

## Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 7+ or yarn 1.22+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd miniprogram-1

# Install dependencies
npm install

# Or using Yarn
# yarn install
```

## Development

### Running the Application

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |
| `npm run type-check` | Run TypeScript type checking |

### Environment Variables

Create a `.env` file in the project root:

```
VITE_API_BASE_URL=https://your-api-endpoint.com
```

## Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# Output will be in the `dist/` directory
```

### Serving Static Files

The production build can be served by any static file server:

```bash
# Using npm's serve (install globally if needed)
npx serve dist

# Or using Python's built-in server (for testing)
python -m http.server 80 --directory dist
```

## Documentation

- **[Contributing Guidelines](CONTRIBUTING.md)** - Code style and best practices
- **[Technical Architecture](ARCHITECTURE.md)** - Detailed architecture documentation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Questions?

For questions or issues, please open a GitHub issue or contact the maintainers.
