export type SeriesCode = "F1" | "F2";
export type StandingType = "drivers" | "teams";
export type SessionStatus = "upcoming" | "live" | "finished" | "tba";

export type CircuitInfo = {
  slug: string;
  name: string;
  locality: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  accent: string;
};

export type RaceSession = {
  id: string;
  series: SeriesCode;
  name: string;
  kind: string;
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  status: SessionStatus;
  source: string;
};

export type RaceRound = {
  id: string;
  series: SeriesCode;
  season: number;
  round: number;
  slug: string;
  name: string;
  startDate: string;
  endDate: string;
  circuit: CircuitInfo;
  sessions: RaceSession[];
};

export type DriverStanding = {
  position: number;
  driverName: string;
  driverCode?: string;
  nationality?: string;
  nationalityCode?: string;
  teamName?: string;
  points: number;
  color?: string;
};

export type TeamStanding = {
  position: number;
  teamName: string;
  points: number;
  color?: string;
};

export type RaceResult = {
  roundId: string;
  series: SeriesCode;
  sessionKind: string;
  position: number;
  driverName: string;
  driverCode?: string;
  nationalityCode?: string;
  teamName?: string;
  laps?: number;
  time?: string;
  points?: number;
  status?: string;
};

export type SeasonOption = {
  year: number;
  label: string;
  current: boolean;
};

export type AgendaData = {
  seasons: SeasonOption[];
  rounds: RaceRound[];
  standings: {
    F1: {
      drivers: DriverStanding[];
      teams: TeamStanding[];
    };
    F2: {
      drivers: DriverStanding[];
      teams: TeamStanding[];
    };
  };
  results: RaceResult[];
};
