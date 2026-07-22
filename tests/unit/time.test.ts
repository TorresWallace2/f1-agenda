import { describe, expect, it } from "vitest";
import { formatBrasiliaTime, getSessionStatus, toGoogleEventId } from "@/lib/time";

describe("time helpers", () => {
  it("formats UTC values in Brasilia time", () => {
    expect(formatBrasiliaTime("2026-07-24T13:00:00.000Z")).toBe("10:00");
  });

  it("computes session states", () => {
    const now = new Date("2026-07-24T13:30:00.000Z");

    expect(getSessionStatus({ startsAtUtc: null, endsAtUtc: null }, now)).toBe("tba");
    expect(getSessionStatus({ startsAtUtc: "2026-07-24T13:00:00.000Z", endsAtUtc: "2026-07-24T14:00:00.000Z" }, now)).toBe("live");
    expect(getSessionStatus({ startsAtUtc: "2026-07-24T15:00:00.000Z", endsAtUtc: "2026-07-24T16:00:00.000Z" }, now)).toBe("upcoming");
    expect(getSessionStatus({ startsAtUtc: "2026-07-24T11:00:00.000Z", endsAtUtc: "2026-07-24T12:00:00.000Z" }, now)).toBe("finished");
  });

  it("creates deterministic Google event ids", () => {
    expect(toGoogleEventId("Agenda F1 & F2 - 2026 - São Paulo")).toBe("agendaf1f22026saopaulo");
  });
});
