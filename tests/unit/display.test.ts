import { describe, expect, it } from "vitest";
import { fallbackAgendaData } from "@/lib/data/sample-data";
import { countryCodeToFlagEmoji, findNextRaceRound, getSessionClassification } from "@/lib/display";

describe("display helpers", () => {
  it("converts country codes to flag emojis", () => {
    expect(countryCodeToFlagEmoji("BR")).toBe(String.fromCodePoint(127463, 127479));
    expect(countryCodeToFlagEmoji("--")).toBe("--");
  });

  it("selects the next real race round independently of the selected round", () => {
    const rounds = fallbackAgendaData.rounds.filter((round) => round.series === "F1");
    const next = findNextRaceRound(rounds);

    expect(next.round).toBeGreaterThanOrEqual(1);
    expect(next.sessions.some((session) => session.status === "upcoming" || session.status === "live")).toBe(true);
  });

  it("filters classification by finished round and session when real results exist", () => {
    const round = fallbackAgendaData.rounds.find((item) => item.series === "F1" && item.round === 10);
    const session = round?.sessions.find((item) => item.kind === "qualifying");

    expect(round).toBeTruthy();
    expect(session).toBeTruthy();

    const classification = getSessionClassification(
      [
        {
          roundId: round!.id,
          series: "F1",
          sessionKind: "qualifying",
          position: 2,
          driverName: "Driver B"
        },
        {
          roundId: round!.id,
          series: "F1",
          sessionKind: "qualifying",
          position: 1,
          driverName: "Driver A"
        }
      ],
      round!,
      session!
    );

    expect(classification).toHaveLength(2);
    expect(classification[0].driverName).toBe("Driver A");
    expect(classification.every((result) => result.roundId === round!.id && result.sessionKind === "qualifying")).toBe(true);
  });

  it("does not show fake classification for future sessions", () => {
    const round = fallbackAgendaData.rounds.find((item) => item.series === "F1" && item.round === 11);
    const session = round?.sessions.find((item) => item.kind === "practice_1");

    expect(round).toBeTruthy();
    expect(session).toBeTruthy();
    expect(getSessionClassification(fallbackAgendaData.results, round!, session!)).toHaveLength(0);
  });
});
