import * as cheerio from "cheerio";
import { mapLimit } from "@/lib/data/concurrency";
import { getCircuitMetadata } from "@/lib/data/static-metadata";
import type { DriverStanding, RaceResult, RaceRound, TeamStanding } from "@/lib/data/types";
import { fallbackAgendaData } from "@/lib/data/sample-data";
import { getSessionStatus } from "@/lib/time";

const F2_BASE = "https://www.fiaformula2.com";
const F2_RESULTS_BASE = "https://api.formula1.com/v2/core-fom-results";
const F2_API_KEY = "MsEALPOPbzgjZIWE6GmU2O69VKY8zZpi";

async function fetchHtml(url: string) {
  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 } });
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

async function fetchF2Json<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { apikey: F2_API_KEY },
      next: { revalidate: 60 * 60 }
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const aliases: Record<string, string> = {
    melbourne: "australia",
    miami_gardens: "miami",
    montreal: "canada",
    monte_carlo: "monaco",
    barcelona_catalunya: "spain",
    spielberg: "austria",
    silverstone: "great_britain",
    spa_francorchamps: "belgium",
    budapest: "hungary",
    monza: "italy",
    yas_marina: "abu_dhabi"
  };

  return aliases[normalized] ?? normalized;
}

function officialRaceSlug(slug: string) {
  const aliases: Record<string, string> = {
    australia: "melbourne",
    miami: "miami-gardens",
    canada: "montreal",
    monaco: "monte-carlo",
    spain: "barcelona",
    austria: "spielberg",
    great_britain: "silverstone",
    belgium: "spa-francorchamps",
    hungary: "budapest",
    azerbaijan: "baku",
    qatar: "lusail",
    abu_dhabi: "yas-marina"
  };

  return aliases[slug] ?? slug;
}

type OfficialF2Result = {
  positionValue?: string;
  positionNumber?: string;
  displayPosition?: string;
  classifiedTime?: string;
  displayTime?: string;
  raceTime?: string;
  gapToLeader?: string;
  lapsCompleted?: string;
  racePoints?: number;
  completionStatusCode?: string;
  version?: string;
  driverFirstName?: string;
  driverLastName?: string;
  driverShortName?: string;
  driverTLA?: string;
  driverReference?: string;
  teamName?: string;
  displayTeamName?: string;
  constructorSeasonName?: string | null;
};

type OfficialF2Session = {
  session: string;
  shortName?: string;
  startTime?: string;
  endTime?: string;
  gmtOffset?: string;
  state?: string;
  value?: string;
  isAvailable?: boolean;
  results?: OfficialF2Result[];
};

type OfficialF2SessionResultsResponse = {
  sessionResults?: OfficialF2Session;
};

function parseMeetingSessions(html: string, season: number) {
  const match = html.match(new RegExp(`\\\\"meetingSessions\\\\":(\\[.*?\\]),\\\\"season\\\\":\\\\"${season}\\\\"`, "s"));
  if (!match) return [];

  try {
    return JSON.parse(match[1].replace(/\\"/g, '"').replace(/\\u0026/g, "&")) as OfficialF2Session[];
  } catch {
    return [];
  }
}

function sessionKindFromOfficialSession(session: string) {
  const kindBySession: Record<string, string> = {
    p: "practice",
    q: "qualifying",
    r1: "sprint",
    r: "feature"
  };

  return kindBySession[session];
}

function parseOfficialSessions(html: string, season: number, round: number) {
  const sessions = parseMeetingSessions(html, season);

  return sessions
    .filter((session) => session.startTime)
    .map((session) => {
      const nameByKind: Record<string, string> = {
        practice: "Treino Livre",
        qualifying: "Classificação",
        sprint: "Corrida Sprint",
        feature: "Corrida 2"
      };
      const kind = sessionKindFromOfficialSession(session.session) ?? session.session;
      const offset = session.gmtOffset ?? "Z";
      const startsAtUtc = session.startTime ? new Date(`${session.startTime}${offset}`).toISOString() : null;
      const endsAtUtc = session.endTime ? new Date(`${session.endTime}${offset}`).toISOString() : null;

      return {
        id: `f2-${round}-${kind}`,
        series: "F2" as const,
        name: nameByKind[kind] ?? session.shortName ?? kind,
        kind,
        startsAtUtc,
        endsAtUtc,
        status: getSessionStatus({ startsAtUtc, endsAtUtc }),
        source: "fiaformula2"
      };
    });
}

const countryNameToCode: Record<string, string> = {
  Argentina: "AR",
  Australia: "AU",
  Belgium: "BE",
  Brazil: "BR",
  Bulgaria: "BG",
  France: "FR",
  Germany: "DE",
  Ireland: "IE",
  Italy: "IT",
  Japan: "JP",
  Mexico: "MX",
  Netherlands: "NL",
  Paraguay: "PY",
  Poland: "PL",
  Spain: "ES",
  Sweden: "SE",
  "United Kingdom": "GB",
  "United States of America": "US"
};

function driverReferenceFromImage(src?: string) {
  return src?.match(/\/([a-z]{6}\d{2})\/2026/i)?.[1]?.toUpperCase();
}

export function parseF2DriverNationalityCodes(html: string) {
  const $ = cheerio.load(html);
  const codes: Record<string, string> = {};

  $("a[href^='/en/drivers/']").each((_, element) => {
    const card = $(element).closest("li, article, div");
    const flagTitle = card
      .find("title")
      .toArray()
      .map((title) => $(title).text())
      .find((title) => title.startsWith("Flag of "));
    const countryCode = flagTitle ? countryNameToCode[flagTitle.replace("Flag of ", "")] : undefined;
    const driverReference = driverReferenceFromImage(card.find("img[src*='number']").attr("src"));

    if (driverReference && countryCode) {
      codes[driverReference] = countryCode;
    }
  });

  return codes;
}

function numericValue(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseOfficialF2Results(results: OfficialF2Result[], round: number, sessionKind: string, nationalityCodes: Record<string, string> = {}): RaceResult[] {
  return results.map((result, index) => {
    const driverReference = result.driverReference?.toUpperCase();
    const driverName = `${result.driverFirstName ?? ""} ${result.driverLastName ?? ""}`.trim() || result.driverShortName || result.driverTLA || "-";
    const points = sessionKind === "sprint" || sessionKind === "feature" ? result.racePoints : undefined;

    return {
      roundId: `f2-${round}`,
      series: "F2" as const,
      sessionKind,
      position: numericValue(result.positionValue ?? result.positionNumber ?? result.displayPosition, index + 1),
      driverName,
      driverCode: result.driverTLA,
      nationalityCode: driverReference ? nationalityCodes[driverReference] : undefined,
      teamName: result.displayTeamName ?? result.teamName ?? result.constructorSeasonName ?? undefined,
      laps: Number(result.lapsCompleted) || undefined,
      time: result.displayTime ?? result.classifiedTime ?? result.raceTime ?? result.gapToLeader,
      points,
      status: result.completionStatusCode ?? result.version
    };
  });
}

export async function getF2Calendar(season: number): Promise<RaceRound[]> {
  const html = await fetchHtml(`${F2_BASE}/en/racing/${season}`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const text = $.root().text().replace(/\s+/g, " ");
  const pattern = /ROUND\s+(\d+)(?:\s+Next Race)?\s+(\d{2})\s+-\s+(\d{2})\s+([A-Z]{3})\s+Flag of [^A-Z]+?([A-Za-zÀ-ÿ\-\s]+?)\s+(Australia|Miami|Canada|Monaco|Barcelona-Catalunya|Austria|Great Britain|Belgium|Hungary|Italy|Spain|Azerbaijan|Qatar|Abu Dhabi)/gi;
  const monthMap: Record<string, string> = {
    MAR: "03",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    SEP: "09",
    NOV: "11",
    DEC: "12"
  };

  const rounds: RaceRound[] = [];
  for (const match of text.matchAll(pattern)) {
    const [, round, startDay, endDay, month, venue] = match;
    const slug = slugify(venue.trim());
    const fallbackSessions =
      fallbackAgendaData.rounds
        .find((item) => item.series === "F2" && item.round === Number(round))
        ?.sessions.map((session) => ({ ...session, source: "fallback" })) ?? [];
    const raceHtml = await fetchHtml(`${F2_BASE}/en/racing/${season}/${officialRaceSlug(slug)}`);
    const officialSessions = raceHtml ? parseOfficialSessions(raceHtml, season, Number(round)) : [];
    const startDate = `${season}-${monthMap[month.toUpperCase()]}-${startDay}T00:00:00.000Z`;
    const endDate = `${season}-${monthMap[month.toUpperCase()]}-${endDay}T23:59:00.000Z`;

    rounds.push({
      id: `f2-${round}-${slug}`,
      series: "F2",
      season,
      round: Number(round),
      slug,
      name: venue.trim(),
      startDate,
      endDate,
      circuit: getCircuitMetadata(slug),
      sessions: officialSessions.length ? officialSessions : fallbackSessions
    });
  }

  if (rounds.length) return rounds;

  const fallbackRounds = fallbackAgendaData.rounds.filter((round) => round.series === "F2" && round.season === season);

  return Promise.all(
    fallbackRounds.map(async (round) => {
      const raceHtml = await fetchHtml(`${F2_BASE}/en/racing/${season}/${officialRaceSlug(round.slug)}`);
      const officialSessions = raceHtml ? parseOfficialSessions(raceHtml, season, round.round) : [];

      return {
        ...round,
        sessions: officialSessions.length ? officialSessions : round.sessions.map((session) => ({ ...session, source: "fallback" }))
      };
    })
  );
}

export async function getF2OfficialSessionResults(season: number, rounds: RaceRound[]): Promise<RaceResult[]> {
  const f2Rounds = rounds.filter((round) => round.series === "F2" && round.sessions.some((session) => session.status === "finished"));
  if (!f2Rounds.length) return [];

  const driversHtml = await fetchHtml(`${F2_BASE}/en/drivers`);
  const nationalityCodes = driversHtml ? parseF2DriverNationalityCodes(driversHtml) : {};

  const resultGroups = await mapLimit(
    f2Rounds,
    3,
    async (round) => {
      const raceHtml = await fetchHtml(`${F2_BASE}/en/racing/${season}/${officialRaceSlug(round.slug)}`);
      if (!raceHtml) return [];

      const sessions = parseMeetingSessions(raceHtml, season);
      const availableSessions = sessions.filter((session) => session.isAvailable && session.state !== "upcoming");
      const sessionResults = await mapLimit(
        availableSessions,
        2,
        async (session) => {
          const sessionKind = sessionKindFromOfficialSession(session.session);
          if (!sessionKind) return [];

          const embeddedResults = session.results;
          const response = session.value ? await fetchF2Json<OfficialF2SessionResultsResponse>(`${F2_RESULTS_BASE}/${session.value}`) : null;
          const officialResults = response?.sessionResults?.results ?? embeddedResults ?? [];

          return parseOfficialF2Results(officialResults, round.round, sessionKind, nationalityCodes);
        }
      );

      return sessionResults.flat();
    }
  );

  return resultGroups.flat();
}

export async function getF2DriverStandings(season: number): Promise<DriverStanding[]> {
  const html = await fetchHtml(`${F2_BASE}/en/standings/${season}/drivers`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const text = $.root().text().replace(/\s+/g, " ");
  const matches = [...text.matchAll(/(\d+)\s+([A-Z]\.\s?[A-Za-zÀ-ÿ'\-\s]+?)\s+([A-Z]{3})\s+[^0-9]{0,80}?([A-Za-zÀ-ÿ\s]+ Racing|MP Motorsport|Invicta Racing|Trident|Hitech|ART Grand Prix|DAMS Lucas Oil|Rodin Motorsport|AIX Racing|Van Amersfoort Racing)[^0-9]{0,40}?(\d+(?:\.\d+)?)/g)];

  return matches.slice(0, 30).map((match) => ({
    position: Number(match[1]),
    driverName: match[2].trim(),
    driverCode: match[3],
    teamName: match[4].trim(),
    points: Number(match[5])
  }));
}

export async function getF2TeamStandings(season: number): Promise<TeamStanding[]> {
  const html = await fetchHtml(`${F2_BASE}/en/standings/${season}/teams`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const text = $.root().text().replace(/\s+/g, " ");
  const matches = [...text.matchAll(/(\d+)\s+(Campos Racing|Rodin Motorsport|MP Motorsport|Invicta Racing|ART Grand Prix|DAMS Lucas Oil|Trident|Hitech|PREMA Racing|AIX Racing|Van Amersfoort Racing)\s+(\d+(?:\.\d+)?)/g)];

  return matches.slice(0, 20).map((match) => ({
    position: Number(match[1]),
    teamName: match[2],
    points: Number(match[3])
  }));
}
