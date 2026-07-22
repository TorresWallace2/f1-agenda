import type { RaceResult, RaceRound, RaceSession } from "@/lib/data/types";

export function countryCodeToFlagEmoji(countryCode?: string | null) {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode)) return countryCode ?? "";

  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

export const nationalityToCountryCode: Record<string, string> = {
  American: "US",
  Argentine: "AR",
  Australian: "AU",
  Austrian: "AT",
  Belgian: "BE",
  Brazilian: "BR",
  British: "GB",
  Bulgarian: "BG",
  Canadian: "CA",
  Chinese: "CN",
  Dutch: "NL",
  Finnish: "FI",
  French: "FR",
  German: "DE",
  Italian: "IT",
  Japanese: "JP",
  Mexican: "MX",
  Monegasque: "MC",
  "New Zealander": "NZ",
  Spanish: "ES",
  Thai: "TH"
};

export function findNextRaceRound(rounds: RaceRound[]) {
  return (
    rounds.find((round) => round.sessions.some((session) => session.status === "live")) ??
    rounds.find((round) => round.sessions.some((session) => session.status === "upcoming")) ??
    rounds[0]
  );
}

export function resultMatchesRound(result: RaceResult, round: RaceRound) {
  const roundPrefix = `${round.series.toLowerCase()}-${round.round}`;
  return result.roundId === round.id || result.roundId === roundPrefix || round.id.startsWith(`${result.roundId}-`);
}

export function getSessionClassification(results: RaceResult[], round: RaceRound, session: RaceSession) {
  if (session.status !== "finished") return [];

  return results
    .filter((result) => result.series === round.series && result.sessionKind === session.kind && resultMatchesRound(result, round))
    .sort((a, b) => a.position - b.position);
}

export function getSessionResultAvailabilityMessage(session: RaceSession) {
  if (session.status === "upcoming" || session.status === "live") {
    return "Classificação ainda não disponível para esta sessão.";
  }

  if (session.status === "tba") {
    return "Horário e classificação ainda não confirmados para esta sessão.";
  }

  return "Resultado oficial ainda não publicado pela fonte de dados.";
}
