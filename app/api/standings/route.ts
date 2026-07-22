import { NextResponse } from "next/server";
import { getStandings } from "@/lib/data/repository";
import { normalizeSeason } from "@/lib/data/seasons";
import type { SeriesCode, StandingType } from "@/lib/data/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = normalizeSeason(searchParams.get("season"));
  const series = (searchParams.get("series") ?? "F1").toUpperCase() as SeriesCode;
  const type = (searchParams.get("type") ?? "drivers") as StandingType;

  if (!["F1", "F2"].includes(series) || !["drivers", "teams"].includes(type)) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  return NextResponse.json(await getStandings(season, series, type));
}
