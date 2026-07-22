import type { CircuitInfo } from "@/lib/data/types";

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const circuitMetadata: Record<string, CircuitInfo> = {
  australia: {
    slug: "australia",
    name: "Albert Park",
    locality: "Melbourne",
    country: "Austrália",
    countryCode: "AU",
    imageUrl: image("photo-1542038784456-1ea8e935640e"),
    accent: "#2f7fe8"
  },
  china: {
    slug: "china",
    name: "Shanghai International Circuit",
    locality: "Shanghai",
    country: "China",
    countryCode: "CN",
    imageUrl: image("photo-1508804185872-d7badad00f7d"),
    accent: "#e53935"
  },
  japan: {
    slug: "japan",
    name: "Suzuka Circuit",
    locality: "Suzuka",
    country: "Japão",
    countryCode: "JP",
    imageUrl: image("photo-1526481280693-3bfa7568e0f3"),
    accent: "#ffffff"
  },
  miami: {
    slug: "miami",
    name: "Miami International Autodrome",
    locality: "Miami Gardens",
    country: "Estados Unidos",
    countryCode: "US",
    imageUrl: image("photo-1507525428034-b723cf961d3e"),
    accent: "#39b8d3"
  },
  canada: {
    slug: "canada",
    name: "Circuit Gilles Villeneuve",
    locality: "Montréal",
    country: "Canadá",
    countryCode: "CA",
    imageUrl: image("photo-1517935706615-2717063c2225"),
    accent: "#df2435"
  },
  monaco: {
    slug: "monaco",
    name: "Circuit de Monaco",
    locality: "Monte Carlo",
    country: "Mônaco",
    countryCode: "MC",
    imageUrl: image("photo-1518684079-3c830dcef090"),
    accent: "#f51f2f"
  },
  spain: {
    slug: "spain",
    name: "Barcelona-Catalunya",
    locality: "Barcelona",
    country: "Espanha",
    countryCode: "ES",
    imageUrl: image("photo-1539037116277-4db20889f2d4"),
    accent: "#f2b84b"
  },
  austria: {
    slug: "austria",
    name: "Red Bull Ring",
    locality: "Spielberg",
    country: "Áustria",
    countryCode: "AT",
    imageUrl: image("photo-1500530855697-b586d89ba3ee"),
    accent: "#f51f2f"
  },
  great_britain: {
    slug: "great_britain",
    name: "Silverstone",
    locality: "Silverstone",
    country: "Grã-Bretanha",
    countryCode: "GB",
    imageUrl: image("photo-1519985176271-adb1088fa94c"),
    accent: "#2f7fe8"
  },
  belgium: {
    slug: "belgium",
    name: "Spa-Francorchamps",
    locality: "Stavelot",
    country: "Bélgica",
    countryCode: "BE",
    imageUrl: image("photo-1500534314209-a25ddb2bd429"),
    accent: "#f2b84b"
  },
  hungary: {
    slug: "hungary",
    name: "Hungaroring",
    locality: "Budapest",
    country: "Hungria",
    countryCode: "HU",
    imageUrl: image("photo-1549877452-9c387954fbc2"),
    accent: "#18a957"
  },
  netherlands: {
    slug: "netherlands",
    name: "Zandvoort",
    locality: "Zandvoort",
    country: "Holanda",
    countryCode: "NL",
    imageUrl: image("photo-1500534314209-a25ddb2bd429"),
    accent: "#ff7f2a"
  },
  italy: {
    slug: "italy",
    name: "Monza",
    locality: "Monza",
    country: "Itália",
    countryCode: "IT",
    imageUrl: image("photo-1523906834658-6e24ef2386f9"),
    accent: "#18a957"
  },
  madrid: {
    slug: "madrid",
    name: "Madring",
    locality: "Madrid",
    country: "Espanha",
    countryCode: "ES",
    imageUrl: image("photo-1539037116277-4db20889f2d4"),
    accent: "#f2b84b"
  },
  azerbaijan: {
    slug: "azerbaijan",
    name: "Baku City Circuit",
    locality: "Baku",
    country: "Azerbaijão",
    countryCode: "AZ",
    imageUrl: image("photo-1518998053901-5348d3961a04"),
    accent: "#39b8d3"
  },
  singapore: {
    slug: "singapore",
    name: "Marina Bay",
    locality: "Singapura",
    country: "Singapura",
    countryCode: "SG",
    imageUrl: image("photo-1525625293386-3f8f99389edd"),
    accent: "#f51f2f"
  },
  united_states: {
    slug: "united_states",
    name: "Circuit of the Americas",
    locality: "Austin",
    country: "Estados Unidos",
    countryCode: "US",
    imageUrl: image("photo-1531218150217-54595bc2b934"),
    accent: "#2f7fe8"
  },
  mexico: {
    slug: "mexico",
    name: "Autódromo Hermanos Rodríguez",
    locality: "Cidade do México",
    country: "México",
    countryCode: "MX",
    imageUrl: image("photo-1518105779142-d975f22f1b0a"),
    accent: "#18a957"
  },
  brazil: {
    slug: "brazil",
    name: "Interlagos",
    locality: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    imageUrl: image("photo-1483729558449-99ef09a8c325"),
    accent: "#18a957"
  },
  las_vegas: {
    slug: "las_vegas",
    name: "Las Vegas Strip Circuit",
    locality: "Las Vegas",
    country: "Estados Unidos",
    countryCode: "US",
    imageUrl: image("photo-1605833556294-ea5c7a74f57d"),
    accent: "#b978ff"
  },
  qatar: {
    slug: "qatar",
    name: "Lusail",
    locality: "Lusail",
    country: "Qatar",
    countryCode: "QA",
    imageUrl: image("photo-1512632578888-169bbbc64f33"),
    accent: "#8a1538"
  },
  abu_dhabi: {
    slug: "abu_dhabi",
    name: "Yas Marina",
    locality: "Abu Dhabi",
    country: "Emirados Árabes Unidos",
    countryCode: "AE",
    imageUrl: image("photo-1512453979798-5ea266f8880c"),
    accent: "#39b8d3"
  }
};

export function getCircuitMetadata(slug: string): CircuitInfo {
  return (
    circuitMetadata[slug] ?? {
      slug,
      name: slug.replace(/_/g, " "),
      locality: "",
      country: "",
      countryCode: "--",
      imageUrl: image("photo-1500530855697-b586d89ba3ee"),
      accent: "#f51f2f"
    }
  );
}
