import { NextResponse } from "next/server";
import { getResults } from "@/lib/data/repository";
import { normalizeSeason } from "@/lib/data/seasons";
import type { SeriesCode } from "@/lib/data/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = normalizeSeason(searchParams.get("season"));
  const series = (searchParams.get("series") ?? "F1").toUpperCase() as SeriesCode;
  const round = searchParams.get("round") ?? undefined;
  const sessionKind = searchParams.get("sessionKind") ?? undefined;

  if (!["F1", "F2"].includes(series)) {
    return NextResponse.json({ error: "Série inválida." }, { status: 400 });
  }

  return NextResponse.json(await getResults(season, series, round, sessionKind));
}
