import * as cheerio from "cheerio";
import { getCircuitMetadata } from "@/lib/data/static-metadata";
import type { DriverStanding, RaceResult, RaceRound, TeamStanding } from "@/lib/data/types";
import { normalizeF1TeamName } from "@/lib/data/f1-normalization";
import { nationalityToCountryCode } from "@/lib/display";
import { getSessionStatus } from "@/lib/time";

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";
const OPENF1_BASE = "https://api.openf1.org/v1";

type ProviderResult<T> = {
  data: T;
  source: string;
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 } });
    if (!response.ok) return null;
    return response.text();
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
    australian: "australia",
    chinese: "china",
    japanese: "japan",
    miami: "miami",
    canadian: "canada",
    monaco: "monaco",
    spanish: "spain",
    barcelona: "spain",
    austrian: "austria",
    british: "great_britain",
    belgian: "belgium",
    hungarian: "hungary",
    dutch: "netherlands",
    italian: "italy",
    azerbaijan: "azerbaijan",
    singapore: "singapore",
    united_states: "united_states",
    mexico_city: "mexico",
    sao_paulo: "brazil",
    brazilian: "brazil",
    las_vegas: "las_vegas",
    qatar: "qatar",
    abu_dhabi: "abu_dhabi"
  };

  return aliases[normalized] ?? normalized;
}

export async function getF1Calendar(season: number): Promise<ProviderResult<RaceRound[]>> {
  const jolpica = await fetchJson<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{
          season: string;
          round: string;
          raceName: string;
          date: string;
          time?: string;
          Circuit: {
            circuitName: string;
            Location: {
              locality: string;
              country: string;
            };
          };
          FirstPractice?: { date: string; time?: string };
          SecondPractice?: { date: string; time?: string };
          ThirdPractice?: { date: string; time?: string };
          Qualifying?: { date: string; time?: string };
          SprintQualifying?: { date: string; time?: string };
          Sprint?: { date: string; time?: string };
        }>;
      };
    };
  }>(`${JOLPICA_BASE}/${season}.json`);

  const races = jolpica?.MRData?.RaceTable?.Races;
  if (!races?.length) return { data: [], source: "jolpica-empty" };

  const rounds = races.map((race) => {
    const slug = slugify(race.raceName.replace(/ grand prix/i, ""));
    const metadata = getCircuitMetadata(slug);
    const circuit = {
      ...metadata,
      name: race.Circuit.circuitName || getCircuitMetadata(slug).name,
      locality: race.Circuit.Location.locality || metadata.locality,
      country: metadata.country
    };

    const rawSessions = [
      ["Treino Livre 1", "practice_1", race.FirstPractice],
      ["Treino Livre 2", "practice_2", race.SecondPractice],
      ["Treino Livre 3", "practice_3", race.ThirdPractice],
      ["Classificação Sprint", "sprint_qualifying", race.SprintQualifying],
      ["Corrida Sprint", "sprint", race.Sprint],
      ["Classificação", "qualifying", race.Qualifying],
      ["Corrida", "race", { date: race.date, time: race.time }]
    ] as const;

    const sessions = rawSessions
      .filter(([, , session]) => session?.date)
      .map(([name, kind, session]) => {
        const startsAtUtc = session?.time ? `${session.date}T${session.time.replace("Z", ".000Z")}` : null;
        const endsAtUtc = startsAtUtc ? new Date(new Date(startsAtUtc).getTime() + (kind === "race" ? 120 : 60) * 60_000).toISOString() : null;

        return {
          id: `f1-${race.round}-${kind}`,
          series: "F1" as const,
          name,
          kind,
          startsAtUtc,
          endsAtUtc,
          status: getSessionStatus({ startsAtUtc, endsAtUtc }),
          source: "jolpica"
        };
      });

    const sessionDates = sessions.map((session) => session.startsAtUtc).filter(Boolean) as string[];
    const sortedSessionDates = sessionDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return {
      id: `f1-${race.round}-${slug}`,
      series: "F1" as const,
      season: Number(race.season),
      round: Number(race.round),
      slug,
      name: race.raceName,
      startDate: sortedSessionDates[0] ?? `${race.date}T00:00:00.000Z`,
      endDate: sortedSessionDates[sortedSessionDates.length - 1] ?? `${race.date}T23:59:00.000Z`,
      circuit,
      sessions
    };
  });

  return { data: rounds, source: "jolpica" };
}

export async function getOpenF1Sessions(season: number) {
  return fetchJson<Array<Record<string, unknown>>>(`${OPENF1_BASE}/sessions?year=${season}`);
}

export async function getF1DriverStandings(season: number): Promise<DriverStanding[]> {
  const data = await fetchJson<{
    MRData?: {
      StandingsTable?: {
        StandingsLists?: Array<{
          DriverStandings?: Array<{
            position: string;
            points: string;
            Driver: { givenName: string; familyName: string; code?: string; nationality?: string };
            Constructors?: Array<{ name: string }>;
          }>;
        }>;
      };
    };
  }>(`${JOLPICA_BASE}/${season}/driverstandings.json`);

  return (
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.map((item) => ({
      position: Number(item.position),
      driverName: `${item.Driver.givenName} ${item.Driver.familyName}`,
      driverCode: item.Driver.code,
      nationality: item.Driver.nationality,
      nationalityCode: item.Driver.nationality ? nationalityToCountryCode[item.Driver.nationality] : undefined,
      teamName: normalizeF1TeamName(item.Constructors?.[0]?.name, season),
      points: Number(item.points)
    })) ?? []
  );
}

export async function getF1TeamStandings(season: number): Promise<TeamStanding[]> {
  const data = await fetchJson<{
    MRData?: {
      StandingsTable?: {
        StandingsLists?: Array<{
          ConstructorStandings?: Array<{
            position: string;
            points: string;
            Constructor: { name: string };
          }>;
        }>;
      };
    };
  }>(`${JOLPICA_BASE}/${season}/constructorstandings.json`);

  return (
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings?.map((item) => ({
      position: Number(item.position),
      teamName: normalizeF1TeamName(item.Constructor.name, season) ?? item.Constructor.name,
      points: Number(item.points)
    })) ?? []
  );
}

function driverName(driver: { givenName: string; familyName: string }) {
  return `${driver.givenName} ${driver.familyName}`;
}

function driverNationalityCode(nationality?: string) {
  return nationality ? nationalityToCountryCode[nationality] : undefined;
}

const driverCountryByCode: Record<string, string> = {
  ALB: "TH",
  ALO: "ES",
  ANT: "IT",
  BEA: "GB",
  BOR: "BR",
  BOT: "FI",
  COL: "AR",
  GAS: "FR",
  HAD: "FR",
  HAM: "GB",
  HUL: "DE",
  LAW: "NZ",
  LEC: "MC",
  LIN: "SE",
  NOR: "GB",
  OCO: "FR",
  PER: "MX",
  PIA: "AU",
  RUS: "GB",
  SAI: "ES",
  TSU: "JP",
  VER: "NL"
};

type OfficialF1RaceLink = {
  round: number;
  baseUrl: string;
};

async function getOfficialF1RaceLinks(season: number): Promise<OfficialF1RaceLink[]> {
  const html = await fetchText(`https://www.formula1.com/en/results/${season}/races`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const raceResultLinks = [
    ...new Set(
      $("a[href]")
        .map((_, element) => $(element).attr("href"))
        .get()
        .filter((href): href is string => Boolean(href?.includes(`/en/results/${season}/races/`) && href.endsWith("/race-result")))
    )
  ];

  return raceResultLinks.map((href, index) => ({
    round: index + 1,
    baseUrl: `https://www.formula1.com${href.replace(/\/race-result$/, "")}`
  }));
}

function parseOfficialDriver(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?)([A-Z]{3})$/);

  return {
    driverName: match?.[1]?.trim() ?? normalized,
    driverCode: match?.[2]
  };
}

function numericPosition(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOfficialF1ResultTable(html: string, season: number, round: number, sessionKind: string): RaceResult[] {
  const $ = cheerio.load(html);
  const rows = $("tbody tr").toArray();

  return rows
    .map((row, index) => {
      const cells = $(row)
        .find("td")
        .toArray()
        .map((cell) => $(cell).text().replace(/\s+/g, " ").trim());

      if (cells.length < 6 || !cells[0] || cells[0].toLowerCase() === "error") return null;

      const { driverName, driverCode } = parseOfficialDriver(cells[2] ?? "");
      const isQualifying = sessionKind === "qualifying" || sessionKind === "sprint_qualifying";
      const isPractice = sessionKind.includes("practice");
      const teamName = normalizeF1TeamName(cells[3], season);

      const parsedResult: RaceResult = {
        roundId: `f1-${round}`,
        series: "F1" as const,
        sessionKind,
        position: numericPosition(cells[0], index + 1),
        driverName,
        driverCode,
        nationalityCode: driverCode ? driverCountryByCode[driverCode] : undefined,
        teamName,
        laps: Number(isPractice ? cells[5] : isQualifying ? cells[7] : cells[4]) || undefined,
        time: isPractice ? cells[4] : isQualifying ? cells[6] || cells[5] || cells[4] : cells[5],
        points: !isPractice && !isQualifying ? Number(cells[6]) : undefined,
        status: !isPractice && !isQualifying ? cells[5] : undefined
      };

      return parsedResult;
    })
    .filter((result): result is RaceResult => Boolean(result));
}

export async function getF1OfficialSessionResults(season: number, roundNumbers?: number[]): Promise<RaceResult[]> {
  const raceLinks = await getOfficialF1RaceLinks(season);
  const wantedRounds = roundNumbers ? new Set(roundNumbers) : null;
  const sessionPages = [
    ["practice_1", "practice/1"],
    ["practice_2", "practice/2"],
    ["practice_3", "practice/3"],
    ["qualifying", "qualifying"],
    ["sprint_qualifying", "sprint-qualifying"],
    ["sprint", "sprint-results"],
    ["race", "race-result"]
  ] as const;

  const resultGroups = await Promise.all(
    raceLinks
      .filter((race) => !wantedRounds || wantedRounds.has(race.round))
      .flatMap((race) =>
        sessionPages.map(async ([sessionKind, path]) => {
          const html = await fetchText(`${race.baseUrl}/${path}`);
          return html ? parseOfficialF1ResultTable(html, season, race.round, sessionKind) : [];
        })
      )
  );

  return resultGroups.flat();
}

export async function getF1RaceResults(season: number): Promise<RaceResult[]> {
  const data = await fetchJson<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{
          round: string;
          Results?: Array<{
            position: string;
            points: string;
            laps: string;
            Time?: { time: string };
            status: string;
            Driver: { givenName: string; familyName: string; code?: string; nationality?: string };
            Constructor: { name: string };
          }>;
        }>;
      };
    };
  }>(`${JOLPICA_BASE}/${season}/results.json?limit=2000`);

  return (
    data?.MRData?.RaceTable?.Races?.flatMap((race) =>
      race.Results?.map((result) => ({
        roundId: `f1-${race.round}`,
        series: "F1" as const,
        sessionKind: "race",
        position: Number(result.position),
        driverName: driverName(result.Driver),
        driverCode: result.Driver.code,
        nationalityCode: driverNationalityCode(result.Driver.nationality),
        teamName: normalizeF1TeamName(result.Constructor.name, season),
        laps: Number(result.laps),
        time: result.Time?.time,
        points: Number(result.points),
        status: result.status
      })) ?? []
    ) ?? []
  );
}

export async function getF1QualifyingResults(season: number): Promise<RaceResult[]> {
  const data = await fetchJson<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{
          round: string;
          QualifyingResults?: Array<{
            position: string;
            Driver: { givenName: string; familyName: string; code?: string; nationality?: string };
            Constructor: { name: string };
            Q1?: string;
            Q2?: string;
            Q3?: string;
          }>;
        }>;
      };
    };
  }>(`${JOLPICA_BASE}/${season}/qualifying.json?limit=2000`);

  return (
    data?.MRData?.RaceTable?.Races?.flatMap((race) =>
      race.QualifyingResults?.map((result) => ({
        roundId: `f1-${race.round}`,
        series: "F1" as const,
        sessionKind: "qualifying",
        position: Number(result.position),
        driverName: driverName(result.Driver),
        driverCode: result.Driver.code,
        nationalityCode: driverNationalityCode(result.Driver.nationality),
        teamName: normalizeF1TeamName(result.Constructor.name, season),
        time: result.Q3 ?? result.Q2 ?? result.Q1,
        status: result.Q3 ? "Q3" : result.Q2 ? "Q2" : "Q1"
      })) ?? []
    ) ?? []
  );
}

export async function getF1SprintResults(season: number): Promise<RaceResult[]> {
  const data = await fetchJson<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{
          round: string;
          SprintResults?: Array<{
            position: string;
            points: string;
            laps: string;
            Time?: { time: string };
            status: string;
            Driver: { givenName: string; familyName: string; code?: string; nationality?: string };
            Constructor: { name: string };
          }>;
        }>;
      };
    };
  }>(`${JOLPICA_BASE}/${season}/sprint.json?limit=2000`);

  return (
    data?.MRData?.RaceTable?.Races?.flatMap((race) =>
      race.SprintResults?.map((result) => ({
        roundId: `f1-${race.round}`,
        series: "F1" as const,
        sessionKind: "sprint",
        position: Number(result.position),
        driverName: driverName(result.Driver),
        driverCode: result.Driver.code,
        nationalityCode: driverNationalityCode(result.Driver.nationality),
        teamName: normalizeF1TeamName(result.Constructor.name, season),
        laps: Number(result.laps),
        time: result.Time?.time,
        points: Number(result.points),
        status: result.status
      })) ?? []
    ) ?? []
  );
}
