import { getCircuitMetadata } from "@/lib/data/static-metadata";
import { f1TeamColors2026 } from "@/lib/data/f1-normalization";
import { SUPPORTED_SEASON } from "@/lib/data/seasons";
import { getSessionStatus } from "@/lib/time";
import type { AgendaData, DriverStanding, RaceRound, SeriesCode, TeamStanding } from "@/lib/data/types";

type RoundSeed = {
  series: SeriesCode;
  round: number;
  slug: string;
  name: string;
  start: string;
  end: string;
  sessions: Array<[string, string, string | null, number]>;
};

const f1Rounds: RoundSeed[] = [
  ["australia", "Australian Grand Prix", "2026-03-06", "2026-03-08"],
  ["china", "Chinese Grand Prix", "2026-03-13", "2026-03-15"],
  ["japan", "Japanese Grand Prix", "2026-03-27", "2026-03-29"],
  ["miami", "Miami Grand Prix", "2026-05-01", "2026-05-03"],
  ["canada", "Canadian Grand Prix", "2026-05-22", "2026-05-24"],
  ["monaco", "Monaco Grand Prix", "2026-06-05", "2026-06-07"],
  ["spain", "Barcelona-Catalunya Grand Prix", "2026-06-12", "2026-06-14"],
  ["austria", "Austrian Grand Prix", "2026-06-26", "2026-06-28"],
  ["great_britain", "British Grand Prix", "2026-07-03", "2026-07-05"],
  ["belgium", "Belgian Grand Prix", "2026-07-17", "2026-07-19"],
  ["hungary", "Hungarian Grand Prix", "2026-07-24", "2026-07-26"],
  ["netherlands", "Dutch Grand Prix", "2026-08-21", "2026-08-23"],
  ["italy", "Italian Grand Prix", "2026-09-04", "2026-09-06"],
  ["madrid", "Spanish Grand Prix", "2026-09-11", "2026-09-13"],
  ["azerbaijan", "Azerbaijan Grand Prix", "2026-09-24", "2026-09-26"],
  ["singapore", "Singapore Grand Prix", "2026-10-09", "2026-10-11"],
  ["united_states", "United States Grand Prix", "2026-10-23", "2026-10-25"],
  ["mexico", "Mexico City Grand Prix", "2026-10-30", "2026-11-01"],
  ["brazil", "São Paulo Grand Prix", "2026-11-06", "2026-11-08"],
  ["las_vegas", "Las Vegas Grand Prix", "2026-11-19", "2026-11-21"],
  ["qatar", "Qatar Grand Prix", "2026-11-27", "2026-11-29"],
  ["abu_dhabi", "Abu Dhabi Grand Prix", "2026-12-04", "2026-12-06"]
].map(([slug, name, start, end], index) => ({
  series: "F1" as const,
  round: index + 1,
  slug,
  name,
  start,
  end,
  sessions: [
    ["Treino Livre 1", "practice_1", `${start}T11:30:00.000Z`, 60],
    ["Treino Livre 2", "practice_2", `${start}T15:00:00.000Z`, 60],
    ["Treino Livre 3", "practice_3", `${end}T11:30:00.000Z`, 60],
    ["Classificação", "qualifying", `${end}T15:00:00.000Z`, 60],
    ["Corrida", "race", `${end}T13:00:00.000Z`, 120]
  ]
}));

const f2Rounds: RoundSeed[] = [
  ["australia", "Melbourne", "2026-03-06", "2026-03-08"],
  ["miami", "Miami Gardens", "2026-05-01", "2026-05-03"],
  ["canada", "Montréal", "2026-05-22", "2026-05-24"],
  ["monaco", "Monte Carlo", "2026-06-04", "2026-06-07"],
  ["spain", "Barcelona-Catalunya", "2026-06-12", "2026-06-14"],
  ["austria", "Spielberg", "2026-06-26", "2026-06-28"],
  ["great_britain", "Silverstone", "2026-07-03", "2026-07-05"],
  ["belgium", "Spa-Francorchamps", "2026-07-17", "2026-07-19"],
  ["hungary", "Budapest", "2026-07-24", "2026-07-26"],
  ["italy", "Monza", "2026-09-04", "2026-09-06"],
  ["madrid", "Madrid", "2026-09-11", "2026-09-13"],
  ["azerbaijan", "Baku", "2026-09-24", "2026-09-26"],
  ["qatar", "Lusail", "2026-11-27", "2026-11-29"],
  ["abu_dhabi", "Yas Marina", "2026-12-04", "2026-12-06"]
].map(([slug, name, start, end], index) => ({
  series: "F2" as const,
  round: index + 1,
  slug,
  name,
  start,
  end,
  sessions: [
    ["Treino Livre", "practice", `${start}T09:05:00.000Z`, 45],
    ["Classificação", "qualifying", `${start}T14:05:00.000Z`, 30],
    ["Sprint Race", "sprint", `${end}T12:15:00.000Z`, 60],
    ["Feature Race", "feature", `${end}T09:25:00.000Z`, 70]
  ]
}));

function buildRound(seed: RoundSeed): RaceRound {
  const circuit = getCircuitMetadata(seed.slug);

  return {
    id: `${seed.series.toLowerCase()}-${seed.round}-${seed.slug}`,
    series: seed.series,
    season: SUPPORTED_SEASON,
    round: seed.round,
    slug: seed.slug,
    name: seed.name,
    startDate: `${seed.start}T00:00:00.000Z`,
    endDate: `${seed.end}T23:59:00.000Z`,
    circuit,
    sessions: seed.sessions.map(([name, kind, startsAtUtc, minutes]) => {
      const endsAtUtc = startsAtUtc ? new Date(new Date(startsAtUtc).getTime() + minutes * 60_000).toISOString() : null;
      return {
        id: `${seed.series.toLowerCase()}-${seed.round}-${kind}`,
        series: seed.series,
        name,
        kind,
        startsAtUtc,
        endsAtUtc,
        status: getSessionStatus({ startsAtUtc, endsAtUtc }),
        source: "fallback"
      };
    })
  };
}

const f1Drivers: DriverStanding[] = [
  ["A. K. Antonelli", "ANT", "IT", "Mercedes", 204],
  ["L. Hamilton", "HAM", "GB", "Ferrari", 159],
  ["G. Russell", "RUS", "GB", "Mercedes", 154],
  ["C. Leclerc", "LEC", "MC", "Ferrari", 126],
  ["L. Norris", "NOR", "GB", "McLaren", 103],
  ["O. Piastri", "PIA", "AU", "McLaren", 92],
  ["M. Verstappen", "VER", "NL", "Red Bull Racing", 91],
  ["I. Hadjar", "HAD", "FR", "Red Bull Racing", 60],
  ["P. Gasly", "GAS", "FR", "Alpine", 42],
  ["L. Lawson", "LAW", "NZ", "Racing Bulls", 39],
  ["A. Lindblad", "LIN", "GB", "Racing Bulls", 22],
  ["F. Colapinto", "COL", "AR", "Alpine", 19],
  ["O. Bearman", "BEA", "GB", "Haas F1 Team", 18],
  ["G. Bortoleto", "BOR", "BR", "Audi", 10],
  ["C. Sainz", "SAI", "ES", "Williams", 6],
  ["A. Albon", "ALB", "TH", "Williams", 5],
  ["E. Ocon", "OCO", "FR", "Haas F1 Team", 3],
  ["F. Alonso", "ALO", "ES", "Aston Martin", 1],
  ["N. Hulkenberg", "HUL", "DE", "Audi", 0],
  ["V. Bottas", "BOT", "FI", "Cadillac", 0],
  ["S. Perez", "PER", "MX", "Cadillac", 0],
  ["L. Stroll", "STR", "CA", "Aston Martin", 0]
].map(([driverName, driverCode, nationalityCode, teamName, points, color], index) => ({
  position: index + 1,
  driverName: String(driverName),
  driverCode: String(driverCode),
  nationalityCode: String(nationalityCode),
  teamName: String(teamName),
  points: Number(points),
  color: color ? String(color) : f1TeamColors2026[String(teamName)]
}));

const f2Drivers: DriverStanding[] = [
  ["N. Tsolov", "TSO", "BG", "Campos Racing", 161, "#f2b84b"],
  ["G. Minì", "MIN", "IT", "MP Motorsport", 134, "#ff8c2f"],
  ["R. Câmara", "CAM", "BR", "Invicta Racing", 125, "#1da1f2"],
  ["A. Dunne", "DUN", "IE", "Rodin Motorsport", 108, "#1f7a54"],
  ["N. León", "LEO", "MX", "Campos Racing", 69, "#f2b84b"],
  ["K. Maini", "MAI", "IN", "ART Grand Prix", 63, "#ffffff"],
  ["D. Beganovic", "BEG", "SE", "DAMS Lucas Oil", 63, "#2f7fe8"],
  ["M. Stenshorne", "STE", "NO", "Rodin Motorsport", 58, "#1f7a54"],
  ["L. van Hoepen", "VHO", "NL", "Trident", 47, "#d7dce1"],
  ["T. Inthraphuvasak", "INT", "TH", "Campos Racing", 46, "#f2b84b"],
  ["J. Dürksen", "DUR", "PY", "Invicta Racing", 36, "#1da1f2"],
  ["R. Miyata", "MIY", "JP", "Hitech", 34, "#e44848"],
  ["O. Goethe", "GOE", "DE", "MP Motorsport", 29, "#ff8c2f"],
  ["S. Montoya", "MON", "CO", "PREMA Racing", 27, "#e53935"],
  ["M. Boya", "BOY", "ES", "PREMA Racing", 24, "#e53935"],
  ["E. Fittipaldi Jr.", "FIT", "BR", "AIX Racing", 20, "#8f5cff"],
  ["C. Shields", "SHI", "GB", "AIX Racing", 18, "#8f5cff"],
  ["N. Varrone", "VAR", "AR", "Van Amersfoort Racing", 14, "#f2b84b"],
  ["R. Villagómez", "VIL", "MX", "Van Amersfoort Racing", 12, "#f2b84b"],
  ["J. Bennett", "BEN", "GB", "Trident", 9, "#d7dce1"],
  ["C. Herta", "HER", "US", "Hitech", 7, "#e44848"],
  ["J. Crawford", "CRA", "US", "DAMS Lucas Oil", 5, "#2f7fe8"]
].map(([driverName, driverCode, nationalityCode, teamName, points, color], index) => ({
  position: index + 1,
  driverName: String(driverName),
  driverCode: String(driverCode),
  nationalityCode: String(nationalityCode),
  teamName: String(teamName),
  points: Number(points),
  color: String(color)
}));

const f1Teams: TeamStanding[] = [
  ["Mercedes", 358, f1TeamColors2026.Mercedes],
  ["Ferrari", 285, f1TeamColors2026.Ferrari],
  ["McLaren", 195, f1TeamColors2026.McLaren],
  ["Red Bull Racing", 151, f1TeamColors2026["Red Bull Racing"]],
  ["Alpine", 61, f1TeamColors2026.Alpine],
  ["Racing Bulls", 61, f1TeamColors2026["Racing Bulls"]],
  ["Haas F1 Team", 21, f1TeamColors2026["Haas F1 Team"]],
  ["Williams", 11, f1TeamColors2026.Williams],
  ["Audi", 10, f1TeamColors2026.Audi],
  ["Aston Martin", 1, f1TeamColors2026["Aston Martin"]],
  ["Cadillac", 0, f1TeamColors2026.Cadillac]
].map(([teamName, points, color], index) => ({ position: index + 1, teamName: String(teamName), points: Number(points), color: String(color) }));

const f2Teams: TeamStanding[] = [
  ["Campos Racing", 230, "#f2b84b"],
  ["Rodin Motorsport", 166, "#1f7a54"],
  ["MP Motorsport", 163, "#ff8c2f"],
  ["Invicta Racing", 161, "#1da1f2"],
  ["ART Grand Prix", 109, "#ffffff"],
  ["DAMS Lucas Oil", 87, "#2f7fe8"],
  ["Trident", 64, "#d7dce1"],
  ["Hitech", 60, "#e44848"],
  ["Van Amersfoort Racing", 52, "#f2b84b"],
  ["PREMA Racing", 40, "#e53935"],
  ["AIX Racing", 20, "#8f5cff"]
].map(([teamName, points, color], index) => ({ position: index + 1, teamName: String(teamName), points: Number(points), color: String(color) }));

const fallbackRounds = [...f1Rounds, ...f2Rounds].map(buildRound);

export const fallbackAgendaData: AgendaData = {
  seasons: [
    { year: SUPPORTED_SEASON, label: String(SUPPORTED_SEASON), current: true }
  ],
  rounds: fallbackRounds,
  standings: {
    F1: {
      drivers: f1Drivers,
      teams: f1Teams
    },
    F2: {
      drivers: f2Drivers,
      teams: f2Teams
    }
  },
  results: []
};
