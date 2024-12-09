import { config } from "dotenv";
import { resolve } from "path";
import { Client } from "pg";
import fs from "fs";
import path from "path";

// Загружаем переменные окружения
config({ path: resolve(process.cwd(), ".env.local") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable");
}

async function executeSqlFile(filePath: string) {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log("Connecting to database...");
    await client.connect();

    console.log("Executing SQL...");
    await client.query(sql);

    console.log("SQL executed successfully!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Получаем путь к SQL файлу из аргументов командной строки
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Please provide the SQL file path as an argument");
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), sqlFile);
executeSqlFile(fullPath);
