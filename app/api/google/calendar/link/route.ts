import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { ensureAgendaCalendar } from "@/lib/google-calendar";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Faça login com Google para vincular a agenda." }, { status: 401 });
  }

  try {
    const link = await ensureAgendaCalendar(userId);
    return NextResponse.json({ calendarId: link.calendarId, calendarName: link.calendarName });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar calendário." }, { status: 500 });
  }
}
