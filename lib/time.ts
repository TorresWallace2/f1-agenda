import type { RaceSession, SessionStatus } from "@/lib/data/types";

export const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

export function formatBrasiliaTime(iso: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!iso) return "A confirmar";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRASILIA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options
  }).format(new Date(iso));
}

export function formatBrasiliaDate(iso: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRASILIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    ...options
  })
    .format(new Date(iso))
    .replace(".", "")
    .toUpperCase();
}

export function getSessionStatus(session: Pick<RaceSession, "startsAtUtc" | "endsAtUtc">, now = new Date()): SessionStatus {
  if (!session.startsAtUtc || !session.endsAtUtc) return "tba";

  const start = new Date(session.startsAtUtc).getTime();
  const end = new Date(session.endsAtUtc).getTime();
  const current = now.getTime();

  if (current > end) return "finished";
  if (current >= start && current <= end) return "live";
  return "upcoming";
}

export function withComputedSessionStatus<T extends RaceSession>(session: T, now = new Date()): T {
  return {
    ...session,
    status: getSessionStatus(session, now)
  };
}

export function toGoogleEventId(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 96);
}
