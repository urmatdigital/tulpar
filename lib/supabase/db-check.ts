import { supabase } from "./config";

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableColumn {
  name: string;
  type: string;
  is_nullable: boolean;
  default_value: string | null;
}

interface TableStructure {
  [key: string]: TableColumn[];
}

interface CheckResult {
  status: "success" | "error";
  tables?: string[];
  missingTables?: string[];
  structure?: TableStructure;
  error?: string;
}

interface RequiredColumn {
  name: string;
  type: string;
}

interface Validation {
  valid: boolean;
  missingColumns: string[];
}

export async function checkTables(): Promise<CheckResult> {
  try {
    // Проверяем существование таблиц напрямую
    const { data: verificationCodes, error: verificationError } = await supabase
      .from("verification_codes")
      .select("*")
      .limit(1);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    const existingTables: string[] = [];
    if (!verificationError) existingTables.push("verification_codes");
    if (!usersError) existingTables.push("users");

    console.log("\nExisting tables:", existingTables);

    const missingTables = ["verification_codes", "users"].filter(
      (table) => !existingTables.includes(table),
    );

    if (missingTables.length > 0) {
      console.log("\nMissing tables:", missingTables);
    }

    // Получаем информацию о колонках для существующих таблиц
    const structure: TableStructure = {};

    for (const table of existingTables) {
      const { data, error } = await supabase.rpc("get_table_info", {
        table_name: table,
      });
      if (!error && data) {
        structure[table] = data.map((col: any) => ({
          name: col.column_name,
          type: col.data_type,
          is_nullable: col.is_nullable === "YES",
          default_value: col.column_default,
        }));
      }
    }

    return {
      status: "success",
      tables: existingTables,
      missingTables,
      structure,
    };
  } catch (error) {
    console.error("Error checking tables:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Проверка обязательных колонок для каждой таблицы
export function validateTableStructure(
  structure: TableStructure,
): Record<string, Validation> {
  const requiredColumns: Record<string, RequiredColumn[]> = {
    verification_codes: [
      { name: "id", type: "bigint" },
      { name: "phone", type: "character varying" },
      { name: "code", type: "character varying" },
      { name: "created_at", type: "timestamp with time zone" },
      { name: "expires_at", type: "timestamp with time zone" },
      { name: "used", type: "boolean" },
    ],
    users: [
      { name: "id", type: "uuid" },
      { name: "phone", type: "character varying" },
      { name: "telegram_id", type: "bigint" },
      { name: "first_name", type: "character varying" },
      { name: "last_name", type: "character varying" },
      { name: "username", type: "character varying" },
      { name: "photo_url", type: "text" },
      { name: "auth_date", type: "bigint" },
      { name: "created_at", type: "timestamp with time zone" },
      { name: "updated_at", type: "timestamp with time zone" },
    ],
  };

  const validation: Record<string, Validation> = {};

  Object.entries(requiredColumns).forEach(([tableName, required]) => {
    const tableColumns = structure[tableName] || [];
    const missingColumns = required.filter(
      (req) =>
        !tableColumns.some(
          (col) =>
            col.name === req.name &&
            col.type.toLowerCase() === req.type.toLowerCase(),
        ),
    );

    validation[tableName] = {
      valid: missingColumns.length === 0,
      missingColumns: missingColumns.map((col) => col.name),
    };
  });

  return validation;
}
