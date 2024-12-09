import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/supabase/schema";

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    return NextResponse.json(health);
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
