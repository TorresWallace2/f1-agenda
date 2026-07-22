import { NextResponse } from "next/server";
import { getCalendar } from "@/lib/data/repository";
import { normalizeSeason } from "@/lib/data/seasons";
import type { SeriesCode } from "@/lib/data/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = normalizeSeason(searchParams.get("season"));
  const series = (searchParams.get("series") ?? "all").toUpperCase();
  const normalizedSeries = series === "F1" || series === "F2" ? (series as SeriesCode) : "all";

  const rounds = await getCalendar(season, normalizedSeries);
  return NextResponse.json(rounds);
}
