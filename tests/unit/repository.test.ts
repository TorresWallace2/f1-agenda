import { describe, expect, it } from "vitest";
import { fallbackAgendaData } from "@/lib/data/sample-data";

describe("fallback agenda data", () => {
  it("contains F1 and F2 rounds for 2026", () => {
    const f1 = fallbackAgendaData.rounds.filter((round) => round.series === "F1");
    const f2 = fallbackAgendaData.rounds.filter((round) => round.series === "F2");

    expect(f1.length).toBeGreaterThanOrEqual(22);
    expect(f2.length).toBeGreaterThanOrEqual(14);
  });

  it("exposes only the 2026 season option", () => {
    expect(fallbackAgendaData.seasons).toEqual([{ year: 2026, label: "2026", current: true }]);
  });

  it("keeps sessions normalized with UTC fields", () => {
    const session = fallbackAgendaData.rounds[0].sessions[0];

    expect(session).toMatchObject({
      series: "F1",
      source: "fallback"
    });
    expect(session.startsAtUtc?.endsWith("Z")).toBe(true);
  });

  it("keeps the 2026 F1 fallback aligned with the current grid", () => {
    const driverTeams = fallbackAgendaData.standings.F1.drivers.map((driver) => driver.teamName);
    const teamNames = fallbackAgendaData.standings.F1.teams.map((team) => team.teamName);
    const allNames = [...driverTeams, ...teamNames].join(" ");

    expect(fallbackAgendaData.standings.F1.drivers).toHaveLength(22);
    expect(teamNames).toContain("Audi");
    expect(teamNames).toContain("Cadillac");
    expect(allNames).not.toMatch(/Sauber|Kick Sauber/i);
  });

  it("does not ship fabricated fallback session results", () => {
    expect(fallbackAgendaData.results).toEqual([]);
  });
});
