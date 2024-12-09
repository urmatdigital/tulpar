import { NextResponse } from "next/server";
import { checkTables, validateTableStructure } from "@/lib/supabase/db-check";

export async function GET() {
  try {
    const result = await checkTables();

    if (result.status === "error") {
      return NextResponse.json(result, { status: 500 });
    }

    // Проверяем структуру таблиц только если она существует
    const structureValidation = result.structure
      ? validateTableStructure(result.structure)
      : {};

    return NextResponse.json({
      ...result,
      structureValidation,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
