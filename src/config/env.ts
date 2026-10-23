// Environment configuration for Vite project
// This file defines API endpoints for different environments (dev/prod)

export interface AppEnv {
  API_BASE_URL: string;
}

// Development environment - uses localhost
const devEnv: AppEnv = {
  API_BASE_URL: 'http://localhost:8000',
};

// Production environment - uses Render deployment
const prodEnv: AppEnv = {
  API_BASE_URL: 'https://onto-agent.onrender.com',
};

// Get current environment based on Vite mode
// In development, Vite sets import.meta.env.MODE to 'development'
// In production builds, it's typically set via --mode flag or defaults to 'production'
export const getCurrentEnv = (): AppEnv => {
  // Check if we're in a production build
  if (import.meta.env.PROD) {
    return prodEnv;
  }
  
  // Default to development environment
  return devEnv;
};

export const env = getCurrentEnv();