import postgres from 'postgres';
import { SUPABASE_PROJECT_API_URL } from '../config/dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';

const client = postgres(SUPABASE_PROJECT_API_URL!)
export const db = drizzle({ client })