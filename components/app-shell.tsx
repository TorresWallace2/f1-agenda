"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flag,
  ListFilter,
  LogIn,
  UserRound
} from "lucide-react";
import type { AgendaData, DriverStanding, RaceRound, SeriesCode, StandingType, TeamStanding } from "@/lib/data/types";
import { countryCodeToFlagEmoji, findNextRaceRound, getSessionClassification, getSessionResultAvailabilityMessage } from "@/lib/display";
import { formatBrasiliaDate, formatBrasiliaTime } from "@/lib/time";

type AppShellProps = {
  data: AgendaData;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

function roundHasFutureSession(round: RaceRound) {
  return round.sessions.some((session) => session.status === "upcoming" || session.status === "live");
}

function pickFeaturedRound(rounds: RaceRound[]) {
  return rounds.find((round) => round.sessions.some((session) => session.status === "live")) ?? rounds.find(roundHasFutureSession) ?? rounds[0];
}

function dateRange(round: RaceRound) {
  const start = formatBrasiliaDate(round.startDate, { day: "2-digit" });
  const end = formatBrasiliaDate(round.endDate, { day: "2-digit", month: "short", year: "numeric" });
  return `${start.split(" ")[0]}-${end}`;
}

function sessionDateLine(iso: string | null) {
  if (!iso) return "Data a confirmar";

  const date = new Date(iso);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short"
  })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  const dayMonth = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit"
  }).format(date);

  return `${weekday}, ${dayMonth}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    finished: "Finalizada",
    live: "Ao vivo",
    upcoming: "Futura",
    tba: "A confirmar"
  };
  return labels[status] ?? status;
}

function CircuitFlag({ code, size = "sm", framed = true }: { code: string; size?: "sm" | "lg" | "hero"; framed?: boolean }) {
  const flag = countryCodeToFlagEmoji(code);
  const sizeClass = {
    sm: "h-7 w-11 text-lg",
    lg: "h-12 w-16 text-3xl",
    hero: "h-20 w-28 text-5xl"
  }[size];

  return (
    <span className={`flex shrink-0 items-center justify-center rounded leading-none ${sizeClass} ${framed ? "border border-white/10 bg-white/10" : ""}`}>
      {flag || <span className="text-xs font-black">{code}</span>}
    </span>
  );
}

function DriverFlag({ code }: { code?: string }) {
  const flag = countryCodeToFlagEmoji(code);

  return (
    <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded bg-white/8 text-xl leading-none">
      {flag || <span className="text-[10px] font-bold text-slate-400">{code ?? "--"}</span>}
    </span>
  );
}

const f1TeamLogo = (slug: string) => `https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000001/common/f1/2026/${slug}/2026${slug}logowhite.webp`;
const f2TeamLogo = (slug: string) => `https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_64/q_auto/v1770000000/common/f2/2026/${slug}/2026${slug}logowhite.webp`;

const teamLogoUrls: Record<string, string> = {
  "alpine": f1TeamLogo("alpine"),
  "aston martin": f1TeamLogo("astonmartin"),
  "audi": f1TeamLogo("audi"),
  "cadillac": f1TeamLogo("cadillac"),
  "ferrari": f1TeamLogo("ferrari"),
  "haas f1 team": f1TeamLogo("haasf1team"),
  "mclaren": f1TeamLogo("mclaren"),
  "mercedes": f1TeamLogo("mercedes"),
  "racing bulls": f1TeamLogo("racingbulls"),
  "red bull racing": f1TeamLogo("redbullracing"),
  "williams": f1TeamLogo("williams"),
  "aix racing": f2TeamLogo("aixracing"),
  "art grand prix": f2TeamLogo("artgrandprix"),
  "campos racing": f2TeamLogo("camposracing"),
  "dams lucas oil": f2TeamLogo("damslucasoil"),
  "hitech": f2TeamLogo("hitech"),
  "invicta racing": f2TeamLogo("invictaracing"),
  "mp motorsport": f2TeamLogo("mpmotorsport"),
  "prema racing": f2TeamLogo("premaracing"),
  "rodin motorsport": f2TeamLogo("rodinmotorsport"),
  "trident": f2TeamLogo("trident"),
  "van amersfoort racing": f2TeamLogo("vanamersfoortracing")
};

function normalizeTeamKey(teamName: string) {
  return teamName.trim().toLowerCase();
}

function teamInitials(teamName: string) {
  return teamName
    .replace(/racing|motorsport|grand prix|lucas oil|f1 team/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function TeamMark({ teamName, color }: { teamName: string; color?: string }) {
  const initials = teamInitials(teamName);
  const logoUrl = teamLogoUrls[normalizeTeamKey(teamName)];

  return (
    <span
      className="relative flex h-8 w-10 shrink-0 items-center justify-center text-[11px] font-black text-white"
      aria-label={`Símbolo ${teamName}`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="relative z-10 h-6 max-w-8 object-contain"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.opacity = "1";
          }}
        />
      ) : null}
      <span
        className={logoUrl ? "absolute opacity-0" : "rounded border border-white/10 bg-white/8 px-1.5 py-1"}
        style={logoUrl ? undefined : { color: color ?? "#ffffff" }}
      >
        {initials || "TM"}
      </span>
    </span>
  );
}

function TeamCell({ teamName }: { teamName?: string }) {
  if (!teamName) return <span className="min-w-0 truncate text-slate-300">-</span>;

  return (
    <span className="flex min-w-0 items-center gap-2 text-slate-300">
      <TeamMark teamName={teamName} />
      <span className="min-w-0 truncate">{teamName}</span>
    </span>
  );
}

export function AppShell({ data, user }: AppShellProps) {
  const [selectedSeries, setSelectedSeries] = useState<SeriesCode>("F1");
  const [standingSeries, setStandingSeries] = useState<SeriesCode>("F1");
  const [standingType, setStandingType] = useState<StandingType>("drivers");
  const [selectedRoundId, setSelectedRoundId] = useState(() => pickFeaturedRound(data.rounds.filter((round) => round.series === "F1"))?.id);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [showFullStandings, setShowFullStandings] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const seriesRounds = useMemo(
    () => data.rounds.filter((round) => round.series === selectedSeries).sort((a, b) => a.round - b.round),
    [data.rounds, selectedSeries]
  );

  const selectedRound = seriesRounds.find((round) => round.id === selectedRoundId) ?? pickFeaturedRound(seriesRounds) ?? seriesRounds[0];
  const nextRound = findNextRaceRound(seriesRounds);
  const nextCircuit = nextRound ?? seriesRounds[0];
  const selectedSession = selectedRound.sessions.find((session) => session.id === selectedSessionId) ?? null;
  const selectedSessionResults = selectedSession ? getSessionClassification(data.results, selectedRound, selectedSession) : [];
  const standings = data.standings[standingSeries][standingType] as Array<DriverStanding | TeamStanding>;
  const sidebarStandings = standings.slice(0, 10);

  function switchSeries(series: SeriesCode) {
    const next = data.rounds.filter((round) => round.series === series);
    setSelectedSeries(series);
    setSelectedRoundId(pickFeaturedRound(next)?.id);
    setSelectedSessionId(null);
    setShowFullCalendar(false);
    setShowFullStandings(false);
  }

  function selectRound(roundId: string) {
    setSelectedRoundId(roundId);
    setSelectedSessionId(null);
    setShowFullCalendar(false);
    setShowFullStandings(false);
  }

  function openFullCalendar() {
    setSelectedSessionId(null);
    setShowFullStandings(false);
    setShowFullCalendar(true);
  }

  function openFullStandings() {
    setSelectedSessionId(null);
    setShowFullCalendar(false);
    setShowFullStandings(true);
  }

  function backToMainView() {
    setSelectedSessionId(null);
    setShowFullCalendar(false);
    setShowFullStandings(false);
  }

  function syncCalendar() {
    if (!user) {
      window.location.href = "/api/auth/signin/google";
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const linkResponse = await fetch("/api/google/calendar/link", { method: "POST" });
      if (!linkResponse.ok) {
        const body = await linkResponse.json().catch(() => ({}));
        setMessage(body.error ?? "Não foi possível criar o calendário.");
        return;
      }

      const syncResponse = await fetch("/api/google/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: selectedRound.season,
          series: selectedRound.series,
          roundId: selectedRound.id
        })
      });

      const body = await syncResponse.json().catch(() => ({}));
      setMessage(syncResponse.ok ? `${body.synced?.length ?? 0} sessões sincronizadas no Google Agenda.` : body.error ?? "Falha na sincronização.");
    });
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-[1680px] gap-4 p-3 text-slate-100 lg:grid-cols-[300px_minmax(0,1fr)_430px] lg:p-4">
      <aside className="rounded-lg border border-white/10 bg-panel/85 p-4 shadow-glow backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-normal">
            Agenda <span className="text-signal">F1</span> & <span className="text-signal">F2</span>
          </h1>
          <Bell className="h-5 w-5 text-slate-400" />
        </div>

        <label className="mt-7 block text-xs font-semibold uppercase text-slate-400">Temporada</label>
        <select className="mt-2 w-full rounded-md border-white/10 bg-panelSoft text-sm text-white">
          {data.seasons.map((season) => (
            <option key={season.year}>{season.label}</option>
          ))}
        </select>

        <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
          <span>Calendário</span>
          <div className="flex rounded-md border border-white/10 p-1">
            {(["F1", "F2"] as const).map((series) => (
              <button
                key={series}
                className={`rounded px-3 py-1 text-sm ${selectedSeries === series ? "bg-signal text-white" : "text-slate-300"}`}
                onClick={() => switchSeries(series)}
              >
                {series}
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-thin mt-3 max-h-[58vh] space-y-1 overflow-y-auto pr-1">
          {seriesRounds.map((round) => (
            <button
              key={round.id}
              className={`grid w-full grid-cols-[42px_1fr_42px] items-center gap-2 rounded-md p-2 text-left transition ${
                selectedRound.id === round.id ? "bg-signal shadow-glow" : "hover:bg-white/7"
              }`}
              onClick={() => selectRound(round.id)}
            >
              <CircuitFlag code={round.circuit.countryCode} framed={false} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{round.circuit.country}</span>
                <span className="block text-xs text-slate-300">{dateRange(round)}</span>
              </span>
              <span className="text-right text-xs text-slate-300">R{round.round}</span>
            </button>
          ))}
        </div>

        <button onClick={openFullCalendar} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15">
          <CalendarPlus className="h-4 w-4" />
          Ver calendário completo
        </button>
      </aside>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-panel/70 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 text-sm">
            <Clock3 className="h-5 w-5 text-slate-400" />
            <span>Horário de Brasília</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={syncCalendar} disabled={isPending} className="flex items-center gap-2 rounded-md border border-white/10 bg-panelSoft px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60">
              <CalendarPlus className="h-4 w-4" />
              {isPending ? "Sincronizando..." : "Adicionar ao Google Agenda"}
            </button>
            <a href={user ? "/api/auth/signout" : "/api/auth/signin/google"} className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-900">
              <LogIn className="h-4 w-4" />
              {user ? user.name ?? "Conta Google" : "Login com Google"}
            </a>
          </div>
        </header>

        {message && <div className="rounded-md border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">{message}</div>}

        {showFullCalendar ? (
          <section className="min-h-[720px] rounded-lg border border-white/10 bg-panel/90 p-4 shadow-glow">
            <button
              onClick={backToMainView}
              className="mb-5 flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase text-signal">Temporada 2026</p>
                <h2 className="mt-1 text-3xl font-black">Calendário completo</h2>
              </div>
              <div className="flex rounded-md border border-white/10 p-1">
                {(["F1", "F2"] as const).map((series) => (
                  <button
                    key={series}
                    className={`rounded px-8 py-2 text-lg font-bold ${selectedSeries === series ? "bg-signal text-white" : "text-slate-300"}`}
                    onClick={() => switchSeries(series)}
                  >
                    {series}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              {seriesRounds.map((round) => (
                <button
                  key={round.id}
                  onClick={() => selectRound(round.id)}
                  className="grid grid-cols-[48px_1fr_72px] items-center gap-3 rounded-md border border-white/10 bg-panelSoft p-3 text-left hover:bg-white/10"
                >
                  <CircuitFlag code={round.circuit.countryCode} framed={false} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{round.circuit.country}</span>
                    <span className="block text-sm text-slate-400">
                      {round.circuit.name} · {dateRange(round)}
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold text-slate-300">R{round.round}</span>
                </button>
              ))}
            </div>
          </section>
        ) : showFullStandings ? (
          <section className="min-h-[720px] rounded-lg border border-white/10 bg-panel/90 p-4 shadow-glow">
            <button
              onClick={backToMainView}
              className="mb-5 flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase text-signal">{standingSeries}</p>
                <h2 className="mt-1 text-3xl font-black">
                  Classificação completa de {standingType === "drivers" ? "pilotos" : "equipes"}
                </h2>
              </div>
              <div className="flex rounded-md border border-white/10 p-1">
                {(["drivers", "teams"] as const).map((type) => (
                  <button
                    key={type}
                    className={`rounded px-6 py-2 text-sm font-bold ${standingType === type ? "bg-signal text-white" : "text-slate-300"}`}
                    onClick={() => setStandingType(type)}
                  >
                    {type === "drivers" ? "Pilotos" : "Equipes"}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/10">
              {standings.map((item) => (
                <div
                  key={`${item.position}-${"driverName" in item ? item.driverName : item.teamName}`}
                  className="grid grid-cols-[48px_48px_1fr_86px] items-center gap-3 border-b border-white/10 bg-panelSoft px-4 py-3 last:border-b-0"
                >
                  <span className="text-slate-300">{item.position}</span>
                  {"driverName" in item ? <DriverFlag code={item.nationalityCode} /> : <TeamMark teamName={item.teamName} color={item.color} />}
                  <span className="min-w-0 truncate font-semibold">{"driverName" in item ? item.driverName : item.teamName}</span>
                  <span className="text-right font-bold">{item.points}</span>
                </div>
              ))}
            </div>
          </section>
        ) : selectedSession ? (
          <section className="min-h-[720px] rounded-lg border border-white/10 bg-panel/90 p-4 shadow-glow">
            <button
              onClick={() => setSelectedSessionId(null)}
              className="mb-5 flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div
              className="overflow-hidden rounded-lg border border-white/10 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(90deg, rgba(5,8,11,.96), rgba(5,8,11,.84)), url(${selectedRound.circuit.imageUrl})` }}
            >
              <div className="p-5 md:p-7">
                <div className="flex flex-wrap items-center gap-4">
                  <CircuitFlag code={selectedRound.circuit.countryCode} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase text-signal">Classificação da sessão</p>
                    <h2 className="mt-1 text-3xl font-black md:text-5xl">{selectedSession.name}</h2>
                    <p className="mt-2 text-sm uppercase text-slate-300">
                      {selectedRound.series} · {selectedRound.circuit.name} · Round {selectedRound.round}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase text-slate-400">Circuito</p>
                    <p className="mt-2 font-semibold">
                      {selectedRound.circuit.locality}, {selectedRound.circuit.country}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase text-slate-400">Horário de Brasília</p>
                    <p className="mt-2 font-semibold">{formatBrasiliaTime(selectedSession.startsAtUtc)}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase text-slate-400">Status</p>
                    <p className="mt-2 font-semibold">{statusLabel(selectedSession.status)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[48px_48px_minmax(150px,1fr)_minmax(120px,1fr)_90px_72px] gap-3 bg-white/8 px-4 py-3 text-xs font-bold uppercase text-slate-400">
                  <span>Pos</span>
                  <span>País</span>
                  <span>Piloto</span>
                  <span>Equipe</span>
                  <span>Tempo</span>
                  <span className="text-right">Pts</span>
                </div>

                {selectedSessionResults.length ? (
                  selectedSessionResults.map((result) => (
                    <div
                      key={`${result.roundId}-${result.sessionKind}-${result.position}-${result.driverName}`}
                      className="grid grid-cols-[48px_48px_minmax(150px,1fr)_minmax(120px,1fr)_90px_72px] items-center gap-3 border-t border-white/10 bg-panelSoft px-4 py-3 text-sm"
                    >
                      <span className="text-slate-300">{result.position}</span>
                      <DriverFlag code={result.nationalityCode} />
                      <span className="min-w-0 truncate font-semibold">{result.driverName}</span>
                      <TeamCell teamName={result.teamName} />
                      <span className="text-slate-300">{result.time ?? result.status ?? "-"}</span>
                      <span className="text-right font-semibold text-amber">{result.points ?? "-"}</span>
                    </div>
                  ))
                ) : (
                  <div className="bg-panelSoft px-4 py-10 text-center text-sm text-slate-400">
                    {getSessionResultAvailabilityMessage(selectedSession)}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <>
            <article className="overflow-hidden rounded-lg border border-white/10 bg-panel shadow-glow">
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <span className="h-5 w-1 rounded bg-signal" />
                  {selectedRound.id === nextRound?.id ? "Próxima Corrida" : "Detalhes do Circuito"}
                </div>
                <div
                  className="relative min-h-[380px] overflow-hidden rounded-lg bg-cover bg-center p-8"
                  style={{ backgroundImage: `linear-gradient(90deg, rgba(5,8,11,.94), rgba(5,8,11,.72), rgba(5,8,11,.25)), url(${selectedRound.circuit.imageUrl})` }}
                >
                  <div className="relative z-10 max-w-xl">
                    <div className="mb-8 flex items-center gap-5">
                      <CircuitFlag code={selectedRound.circuit.countryCode} size="hero" />
                      <div>
                        <h2 className="text-4xl font-black uppercase md:text-6xl">{selectedRound.circuit.country}</h2>
                        <p className="mt-2 text-sm uppercase text-slate-300">{selectedRound.circuit.name}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/35 p-5 backdrop-blur">
                      <p className="text-4xl font-black">{dateRange(selectedRound)}</p>
                      <p className="mt-6 text-xs uppercase text-slate-400">Round {selectedRound.round}</p>
                      <p className="mt-3 text-sm uppercase text-slate-300">
                        {selectedRound.circuit.locality}, {selectedRound.circuit.country}
                      </p>
                      <button onClick={syncCalendar} className="mt-7 flex items-center gap-2 rounded-md bg-signal px-5 py-3 text-sm font-bold hover:bg-red-600">
                        <CalendarPlus className="h-5 w-5" />
                        Adicionar ao Google Agenda
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h3 className="text-lg font-black uppercase">Programação</h3>
                <div className="flex rounded-md border border-white/10 p-1">
                  {(["F1", "F2"] as const).map((series) => (
                    <button
                      key={series}
                      className={`rounded px-8 py-2 text-lg font-bold ${selectedSeries === series ? "bg-signal text-white" : "text-slate-300"}`}
                      onClick={() => switchSeries(series)}
                    >
                      {series}
                    </button>
                  ))}
                </div>
              </div>

              <div className="session-grid mt-5 grid gap-3">
                {selectedRound.sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className="min-h-[104px] rounded-md border border-white/10 bg-panelSoft p-4 text-left transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
                    style={{ borderLeftColor: session.status === "finished" ? "#18a957" : selectedRound.circuit.accent, borderLeftWidth: 4 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xl font-semibold">{session.name}</h4>
                        <p className="mt-2 text-xs font-bold uppercase text-slate-400">{sessionDateLine(session.startsAtUtc)}</p>
                        <p className="mt-2 text-2xl text-slate-300">{formatBrasiliaTime(session.startsAtUtc)}</p>
                      </div>
                      {session.status === "finished" ? <CheckCircle2 className="h-6 w-6 text-racing" /> : <Clock3 className="h-6 w-6 text-slate-500" />}
                    </div>
                    <p className={`mt-3 text-xs font-semibold ${session.status === "finished" ? "text-racing" : session.status === "live" ? "text-signal" : "text-slate-400"}`}>
                      {statusLabel(session.status)}
                    </p>
                  </button>
                ))}
              </div>
              <p className="mt-5 text-center text-xs text-slate-400">Todos os horários em Horário de Brasília</p>
            </section>
          </>
        )}
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
          <div className="grid grid-cols-2 rounded-md border border-white/10 p-1">
            {(["F1", "F2"] as const).map((series) => (
              <button key={series} className={`rounded py-2 text-xl font-black ${standingSeries === series ? "bg-signal text-white" : "text-slate-300"}`} onClick={() => setStandingSeries(series)}>
                {series}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 border-b border-white/10">
            {(["drivers", "teams"] as const).map((type) => (
              <button key={type} className={`py-3 text-sm font-semibold ${standingType === type ? "border-b-2 border-signal text-white" : "text-slate-400"}`} onClick={() => setStandingType(type)}>
                {type === "drivers" ? "Pilotos" : "Equipes"}
              </button>
            ))}
          </div>
          <div className="mt-2 overflow-hidden rounded-md border border-white/10">
            {sidebarStandings.map((item) => (
              <div key={`${item.position}-${"driverName" in item ? item.driverName : item.teamName}`} className="grid grid-cols-[42px_44px_1fr_64px] items-center gap-3 border-b border-white/7 bg-panelSoft px-3 py-3 last:border-b-0">
                <span className="text-center text-slate-300">{item.position}</span>
                {"driverName" in item ? <DriverFlag code={item.nationalityCode} /> : <TeamMark teamName={item.teamName} color={item.color} />}
                <span className="min-w-0 truncate font-medium">{"driverName" in item ? item.driverName : item.teamName}</span>
                <span className="text-right font-semibold">{item.points}</span>
              </div>
            ))}
          </div>
          <button onClick={openFullStandings} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-3 text-sm hover:bg-white/15">
            Ver classificação completa
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>

        <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase">Próximo Circuito</h3>
            <Flag className="h-5 w-5 text-slate-400" />
          </div>
          <div className="rounded-md border border-white/10 bg-panelSoft p-4">
            <div className="flex items-center gap-4">
              <CircuitFlag code={nextCircuit.circuit.countryCode} size="lg" />
              <div>
                <p className="text-xl font-black uppercase">{nextCircuit.circuit.country}</p>
                <p className="text-sm uppercase text-slate-400">{nextCircuit.circuit.name}</p>
              </div>
            </div>
            <p className="mt-7 text-2xl font-semibold">{dateRange(nextCircuit)}</p>
            <p className="mt-4 text-sm uppercase text-slate-400">Round {nextCircuit.round}</p>
            <button onClick={() => selectRound(nextCircuit.id)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-3 text-sm hover:bg-white/15">
              Ver detalhes do circuito
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
          <div className="flex items-center gap-2 text-sm font-black uppercase">
            <ListFilter className="h-5 w-5 text-cyan" />
            Fontes ativas
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>F1: Jolpica + OpenF1 fallback</p>
            <p>F2: páginas oficiais FIA Formula 2</p>
            <p>Agenda: calendário secundário Google</p>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-md bg-white/7 px-3 py-2 text-xs text-slate-400">
            <UserRound className="h-4 w-4" />
            {user?.email ?? "Login necessário para sincronizar"}
          </div>
        </section>
      </aside>
    </main>
  );
}
