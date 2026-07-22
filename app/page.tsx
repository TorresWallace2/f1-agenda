import { getServerSession } from "next-auth";
import { AppShell } from "@/components/app-shell";
import { authOptions } from "@/lib/auth";
import { loadAgendaData } from "@/lib/data/repository";

export default async function Home() {
  const [data, session] = await Promise.all([loadAgendaData(2026), getServerSession(authOptions)]);

  return <AppShell data={data} user={session?.user ?? null} />;
}
