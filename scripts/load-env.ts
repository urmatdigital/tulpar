import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем переменные окружения из .env.local
config({ path: resolve(__dirname, '../.env.local') });
