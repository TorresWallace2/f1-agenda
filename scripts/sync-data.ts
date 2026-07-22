import { loadAgendaData } from "@/lib/data/repository";

const season = Number(process.argv[2] ?? "2026");
const data = await loadAgendaData(season);

console.log(
  JSON.stringify(
    {
      season,
      rounds: data.rounds.length,
      f1Rounds: data.rounds.filter((round) => round.series === "F1").length,
      f2Rounds: data.rounds.filter((round) => round.series === "F2").length,
      f1Drivers: data.standings.F1.drivers.length,
      f2Drivers: data.standings.F2.drivers.length
    },
    null,
    2
  )
);
