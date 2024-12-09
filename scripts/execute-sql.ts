import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Загружаем переменные окружения
config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
});

async function executeSqlFile(filePath: string) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log("Executing SQL...");
    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error("Error executing SQL:", error);
      process.exit(1);
    }

    console.log("SQL executed successfully!");
    console.log("Result:", data);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
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
