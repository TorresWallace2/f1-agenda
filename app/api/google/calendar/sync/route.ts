import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getCalendar } from "@/lib/data/repository";
import { syncRoundToGoogleCalendar } from "@/lib/google-calendar";

const bodySchema = z.object({
  season: z.number().default(2026),
  series: z.enum(["F1", "F2"]),
  roundId: z.string(),
  sessionIds: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Faça login com Google para sincronizar eventos." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const rounds = await getCalendar(parsed.data.season, parsed.data.series);
  const round = rounds.find((item) => item.id === parsed.data.roundId);

  if (!round) {
    return NextResponse.json({ error: "Round não encontrado." }, { status: 404 });
  }

  try {
    return NextResponse.json(await syncRoundToGoogleCalendar(userId, round, parsed.data.sessionIds));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao sincronizar calendário." }, { status: 500 });
  }
}
