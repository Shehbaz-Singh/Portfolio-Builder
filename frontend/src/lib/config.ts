// Read from the environment (frontend/.env.local). Missing values fall back to local defaults
// in development, but fail loudly in production rather than quietly pointing at localhost.
function fromEnv(value: string | undefined, name: string, devDefault: string): string {
  if (value) return value.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') throw new Error(`${name} is not set`);
  return devDefault;
}

// Base URL of the Express API.
export const API_URL = fromEnv(
  process.env.NEXT_PUBLIC_API_URL,
  'NEXT_PUBLIC_API_URL',
  'http://localhost:4000',
);

// Public URL of this site, used for absolute Open Graph and canonical URLs.
export const SITE_URL = fromEnv(
  process.env.NEXT_PUBLIC_SITE_URL,
  'NEXT_PUBLIC_SITE_URL',
  'http://localhost:3000',
);
