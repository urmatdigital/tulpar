import { config } from "dotenv";
import { resolve } from "path";
import { checkTables } from "../lib/supabase/db-check";

// Загружаем переменные окружения из .env.local
config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  try {
    console.log("Checking database structure...");
    const result = await checkTables();

    if (result.status === "error") {
      console.error("Error checking database:", result.error);
      process.exit(1);
    }

    if (result.missingTables && result.missingTables.length > 0) {
      console.error("\nWarning: Missing tables:", result.missingTables);
      console.log(
        "\nPlease run the database migrations to create the missing tables.",
      );
    } else {
      console.log("\nAll required tables exist!");
    }

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

main();
