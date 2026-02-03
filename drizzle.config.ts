import { defineConfig } from 'drizzle-kit';
import { SUPABASE_PROJECT_API_URL } from './src/config/dotenv';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: SUPABASE_PROJECT_API_URL!,
  },
});
