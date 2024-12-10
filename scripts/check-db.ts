import './load-env';
import { checkDatabaseHealth } from '../lib/supabase/schema';

// Загружаем переменные окружения из .env.local
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  try {
    await checkDatabaseHealth();
    console.log('Database check completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error);
    process.exit(1);
  }
}

main();
