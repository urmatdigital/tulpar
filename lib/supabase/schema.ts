import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export async function initializeDatabase() {
  try {
    // Создаем таблицу verification_codes
    const { error: verificationError } = await supabase.rpc("create_table", {
      table_name: "verification_codes",
      definition: `
        id BIGSERIAL PRIMARY KEY,
        phone VARCHAR(15) NOT NULL,
        code VARCHAR(4) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE
      `,
    });

    if (verificationError) {
      console.error(
        "Error creating verification_codes table:",
        verificationError,
      );
      throw verificationError;
    }

    // Создаем индекс для verification_codes
    await supabase.rpc("create_index", {
      table_name: "verification_codes",
      index_name: "idx_verification_codes_phone",
      column_name: "phone",
    });

    // Создаем таблицу users
    const { error: usersError } = await supabase.rpc("create_table", {
      table_name: "users",
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone VARCHAR(15) UNIQUE,
        telegram_id BIGINT UNIQUE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        username VARCHAR(255),
        photo_url TEXT,
        auth_date BIGINT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `,
    });

    if (usersError) {
      console.error("Error creating users table:", usersError);
      throw usersError;
    }

    // Создаем триггер для updated_at
    const { error: triggerError } = await supabase.rpc("create_trigger", {
      table_name: "users",
      trigger_name: "update_users_updated_at",
      trigger_function: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `,
    });

    if (triggerError) {
      console.error("Error creating trigger:", triggerError);
      throw triggerError;
    }

    // Устанавливаем политики безопасности
    await setupSecurityPolicies();

    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}

async function setupSecurityPolicies() {
  try {
    // Политика для verification_codes
    await supabase.rpc("create_policy", {
      table_name: "verification_codes",
      policy_name: "verification_codes_insert_policy",
      operation: "INSERT",
      definition:
        "auth.role() = 'authenticated' OR auth.role() = 'service_role'",
    });

    await supabase.rpc("create_policy", {
      table_name: "verification_codes",
      policy_name: "verification_codes_select_policy",
      operation: "SELECT",
      definition:
        "auth.role() = 'authenticated' OR auth.role() = 'service_role'",
    });

    // Политика для users
    await supabase.rpc("create_policy", {
      table_name: "users",
      policy_name: "users_select_policy",
      operation: "SELECT",
      definition:
        "auth.role() = 'authenticated' OR auth.role() = 'service_role'",
    });

    await supabase.rpc("create_policy", {
      table_name: "users",
      policy_name: "users_insert_policy",
      operation: "INSERT",
      definition: "auth.role() = 'service_role'",
    });

    await supabase.rpc("create_policy", {
      table_name: "users",
      policy_name: "users_update_policy",
      operation: "UPDATE",
      definition: "(auth.uid() = id) OR auth.role() = 'service_role'",
    });

    console.log("Security policies set up successfully");
    return true;
  } catch (error) {
    console.error("Error setting up security policies:", error);
    return false;
  }
}

export async function checkDatabaseHealth() {
  try {
    // Проверяем существование таблиц
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .in("table_name", ["verification_codes", "users"]);

    if (tablesError) {
      throw tablesError;
    }

    const missingTables = ["verification_codes", "users"].filter(
      (tableName) => !tables.some((t) => t.table_name === tableName),
    );

    if (missingTables.length > 0) {
      console.log("Missing tables:", missingTables);
      await initializeDatabase();
    }

    // Проверяем политики безопасности
    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("*");

    if (policiesError) {
      throw policiesError;
    }

    const expectedPolicies = [
      "verification_codes_insert_policy",
      "verification_codes_select_policy",
      "users_select_policy",
      "users_insert_policy",
      "users_update_policy",
    ];

    const missingPolicies = expectedPolicies.filter(
      (policyName) => !policies.some((p) => p.policyname === policyName),
    );

    if (missingPolicies.length > 0) {
      console.log("Missing policies:", missingPolicies);
      await setupSecurityPolicies();
    }

    return {
      status: "healthy",
      tables: tables.map((t) => t.table_name),
      policies: policies.map((p) => p.policyname),
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
