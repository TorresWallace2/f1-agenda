import { fallbackAgendaData } from "@/lib/data/sample-data";
import { getF1Calendar, getF1DriverStandings, getF1OfficialSessionResults, getF1QualifyingResults, getF1RaceResults, getF1SprintResults, getF1TeamStandings } from "@/lib/data/providers/f1-provider";
import { getF2Calendar, getF2DriverStandings, getF2OfficialSessionResults, getF2TeamStandings } from "@/lib/data/providers/f2-provider";
import { normalizeSeason, SUPPORTED_SEASON } from "@/lib/data/seasons";
import type { AgendaData, RaceRound, SeriesCode, StandingType } from "@/lib/data/types";
import { withComputedSessionStatus } from "@/lib/time";

function preferRemote<T>(remote: T[], fallback: T[]) {
  return remote.length ? remote : fallback;
}

export async function loadAgendaData(season = 2026): Promise<AgendaData> {
  season = normalizeSeason(season);

  const [f1Calendar, f2Calendar, f1Drivers, f1Teams, f2Drivers, f2Teams] = await Promise.all([
    getF1Calendar(season),
    getF2Calendar(season),
    getF1DriverStandings(season),
    getF1TeamStandings(season),
    getF2DriverStandings(season),
    getF2TeamStandings(season)
  ]);

  const completedF1Rounds = f1Calendar.data
    .filter((round) => round.sessions.some((session) => session.status === "finished"))
    .map((round) => round.round);
  const [officialF1Results, f1RaceResults, f1QualifyingResults, f1SprintResults] = await Promise.all([
    getF1OfficialSessionResults(season, completedF1Rounds),
    getF1RaceResults(season),
    getF1QualifyingResults(season),
    getF1SprintResults(season)
  ]);

  const fallbackRounds = fallbackAgendaData.rounds.filter((round) => round.season === season);
  const rounds = [
    ...preferRemote(f1Calendar.data, fallbackRounds.filter((round) => round.series === "F1")),
    ...preferRemote(f2Calendar, fallbackRounds.filter((round) => round.series === "F2"))
  ].map((round) => ({
    ...round,
    sessions: round.sessions.map((session) => withComputedSessionStatus(session))
  }));
  const officialF2Results = await getF2OfficialSessionResults(season, rounds);

  return {
    seasons: fallbackAgendaData.seasons,
    rounds,
    standings: {
      F1: {
        drivers: preferRemote(f1Drivers, fallbackAgendaData.standings.F1.drivers),
        teams: preferRemote(f1Teams, fallbackAgendaData.standings.F1.teams)
      },
      F2: {
        drivers: preferRemote(f2Drivers, fallbackAgendaData.standings.F2.drivers),
        teams: preferRemote(f2Teams, fallbackAgendaData.standings.F2.teams)
      }
    },
    results: [...(officialF1Results.length ? officialF1Results : [...f1RaceResults, ...f1QualifyingResults, ...f1SprintResults]), ...officialF2Results]
  };
}

export async function getCalendar(season: number = SUPPORTED_SEASON, series: SeriesCode | "all" = "all"): Promise<RaceRound[]> {
  const data = await loadAgendaData(normalizeSeason(season));
  return series === "all" ? data.rounds : data.rounds.filter((round) => round.series === series);
}

export async function getStandings(season: number = SUPPORTED_SEASON, series: SeriesCode, type: StandingType) {
  const data = await loadAgendaData(normalizeSeason(season));
  return data.standings[series][type];
}

export async function getResults(season: number = SUPPORTED_SEASON, series: SeriesCode, roundId?: string, sessionKind?: string) {
  const data = await loadAgendaData(normalizeSeason(season));
  return data.results.filter(
    (result) =>
      result.series === series &&
      (!roundId || result.roundId.includes(roundId) || roundId.includes(result.roundId)) &&
      (!sessionKind || result.sessionKind === sessionKind)
  );
}
