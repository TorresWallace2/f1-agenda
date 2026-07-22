import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import type { RaceRound, RaceSession } from "@/lib/data/types";
import { BRASILIA_TIME_ZONE, toGoogleEventId } from "@/lib/time";

const CALENDAR_NAME = "Agenda F1 & F2";

async function getGoogleAccount(userId: string) {
  return prisma.account.findFirst({
    where: {
      userId,
      provider: "google"
    }
  });
}

async function getCalendarClient(userId: string) {
  const account = await getGoogleAccount(userId);
  if (!account?.access_token && !account?.refresh_token) {
    throw new Error("Conta Google sem token de calendário. Faça login novamente.");
  }

  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined
  });

  oauth2Client.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? account.access_token,
        refresh_token: tokens.refresh_token ?? account.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : account.expires_at
      }
    });
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function ensureAgendaCalendar(userId: string) {
  const existing = await prisma.googleCalendarLink.findUnique({ where: { userId } });
  if (existing) return existing;

  const calendar = await getCalendarClient(userId);
  const created = await calendar.calendars.insert({
    requestBody: {
      summary: CALENDAR_NAME,
      timeZone: BRASILIA_TIME_ZONE
    }
  });

  if (!created.data.id) {
    throw new Error("Google Calendar não retornou o ID do calendário criado.");
  }

  return prisma.googleCalendarLink.create({
    data: {
      userId,
      calendarId: created.data.id,
      calendarName: CALENDAR_NAME
    }
  });
}

function buildEvent(round: RaceRound, session: RaceSession) {
  if (!session.startsAtUtc || !session.endsAtUtc) return null;

  const id = toGoogleEventId(`agenda-f1-f2-${round.season}-${round.series}-${round.round}-${session.kind}`);

  return {
    id,
    summary: `${round.series} - ${session.name} - ${round.circuit.country}`,
    location: `${round.circuit.name}, ${round.circuit.locality}, ${round.circuit.country}`,
    description: `Agenda F1 & F2\n${round.name}\nRound ${round.round}\nHorário de Brasília.`,
    start: {
      dateTime: session.startsAtUtc,
      timeZone: BRASILIA_TIME_ZONE
    },
    end: {
      dateTime: session.endsAtUtc,
      timeZone: BRASILIA_TIME_ZONE
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 },
        { method: "popup", minutes: 60 }
      ]
    },
    extendedProperties: {
      private: {
        source: "agenda-f1-f2",
        roundId: round.id,
        sessionId: session.id,
        series: round.series
      }
    }
  };
}

export async function syncRoundToGoogleCalendar(userId: string, round: RaceRound, sessionIds?: string[]) {
  const link = await ensureAgendaCalendar(userId);
  const calendar = await getCalendarClient(userId);
  const selected = sessionIds?.length ? round.sessions.filter((session) => sessionIds.includes(session.id)) : round.sessions;
  const synced: Array<{ sessionId: string; eventId: string }> = [];

  for (const session of selected) {
    const event = buildEvent(round, session);
    if (!event) continue;

    await calendar.events.update({
      calendarId: link.calendarId,
      eventId: event.id,
      requestBody: event
    }).catch(async (error) => {
      if (error?.code === 404 || error?.response?.status === 404) {
        await calendar.events.insert({
          calendarId: link.calendarId,
          requestBody: event
        });
        return;
      }
      throw error;
    });

    synced.push({ sessionId: session.id, eventId: event.id });
  }

  return {
    calendarId: link.calendarId,
    synced
  };
}
