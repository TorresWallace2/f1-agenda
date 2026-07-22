const teamAliases2026: Record<string, string> = {
  "alpine": "Alpine",
  "alpine f1 team": "Alpine",
  "aston martin": "Aston Martin",
  "audi": "Audi",
  "audi revolut f1 team": "Audi",
  "cadillac": "Cadillac",
  "cadillac f1 team": "Cadillac",
  "cadillac formula 1 team": "Cadillac",
  "ferrari": "Ferrari",
  "haas": "Haas F1 Team",
  "haas f1 team": "Haas F1 Team",
  "kick sauber": "Audi",
  "mclaren": "McLaren",
  "mercedes": "Mercedes",
  "racing bulls": "Racing Bulls",
  "rb f1 team": "Racing Bulls",
  "red bull racing": "Red Bull Racing",
  "red bull": "Red Bull Racing",
  "sauber": "Audi",
  "stake f1 team kick sauber": "Audi",
  "visa cash app rb": "Racing Bulls",
  "williams": "Williams"
};

export const f1TeamColors2026: Record<string, string> = {
  "Alpine": "#2293d1",
  "Aston Martin": "#229971",
  "Audi": "#d7ff00",
  "Cadillac": "#111827",
  "Ferrari": "#e10600",
  "Haas F1 Team": "#b6babd",
  "McLaren": "#ff8700",
  "Mercedes": "#00d2be",
  "Racing Bulls": "#6692ff",
  "Red Bull Racing": "#3671c6",
  "Williams": "#64c4ff"
};

export function normalizeF1TeamName(teamName: string | undefined, season: number) {
  if (!teamName) return teamName;
  if (season < 2026) return teamName;

  return teamAliases2026[teamName.trim().toLowerCase()] ?? teamName;
}
