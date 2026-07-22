import { NextResponse } from "next/server";
import { fallbackAgendaData } from "@/lib/data/sample-data";

export async function GET() {
  return NextResponse.json(fallbackAgendaData.seasons);
}
