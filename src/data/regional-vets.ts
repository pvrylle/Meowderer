export type RegionalVet = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  country: string;
};

/** Known local vet clinics — supplements sparse OpenStreetMap data. */
export const REGIONAL_VETS: RegionalVet[] = [
  // ── Philippines ──────────────────────────────────────────────
  {
    id: "olongapo-city-vet",
    name: "Olongapo City Veterinary Office",
    lat: 14.8294,
    lng: 120.2826,
    city: "Olongapo",
    region: "Zambales",
    country: "Philippines",
  },
  {
    id: "subic-agri-vet",
    name: "Subic Municipal Agriculture & Veterinary Office",
    lat: 14.8721,
    lng: 120.2338,
    city: "Subic",
    region: "Zambales",
    country: "Philippines",
  },
  {
    id: "zambales-provincial-vet",
    name: "Zambales Provincial Veterinary Office",
    lat: 15.3312,
    lng: 119.9754,
    city: "Iba",
    region: "Zambales",
    country: "Philippines",
  },
  {
    id: "angeles-animal-hospital",
    name: "Angeles City Animal Hospital",
    lat: 15.1455,
    lng: 120.593,
    city: "Angeles",
    region: "Pampanga",
    country: "Philippines",
  },
  {
    id: "sbma-vet-clinic",
    name: "SBMA Veterinary Clinic",
    lat: 14.7958,
    lng: 120.2694,
    city: "Subic Bay",
    region: "Zambales",
    country: "Philippines",
  },
  {
    id: "makati-vet-center",
    name: "Makati Veterinary Services",
    lat: 14.5547,
    lng: 121.0244,
    city: "Makati",
    region: "Metro Manila",
    country: "Philippines",
  },
  {
    id: "quezon-city-vet",
    name: "Quezon City Veterinary Department",
    lat: 14.676,
    lng: 121.0437,
    city: "Quezon City",
    region: "Metro Manila",
    country: "Philippines",
  },
  {
    id: "pasig-city-vet",
    name: "Pasig City Veterinary Office",
    lat: 14.5606,
    lng: 121.0845,
    city: "Pasig",
    region: "Metro Manila",
    country: "Philippines",
  },
  {
    id: "cebu-vet-office",
    name: "Cebu City Veterinary Office",
    lat: 10.3157,
    lng: 123.8854,
    city: "Cebu City",
    region: "Cebu",
    country: "Philippines",
  },

  // ── United States ────────────────────────────────────────────
  {
    id: "nyc-vet-public-health",
    name: "NYC Veterinary Public Health Services",
    lat: 40.7128,
    lng: -74.006,
    city: "New York",
    region: "New York",
    country: "United States",
  },
  {
    id: "la-county-vet",
    name: "Los Angeles County Veterinary Public Health",
    lat: 34.0522,
    lng: -118.2437,
    city: "Los Angeles",
    region: "California",
    country: "United States",
  },
  {
    id: "chicago-animal-care-vet",
    name: "Chicago Animal Care and Control — Veterinary",
    lat: 41.8362,
    lng: -87.6841,
    city: "Chicago",
    region: "Illinois",
    country: "United States",
  },
  {
    id: "sf-acc-vet",
    name: "San Francisco Animal Care & Control",
    lat: 37.7749,
    lng: -122.4194,
    city: "San Francisco",
    region: "California",
    country: "United States",
  },
  {
    id: "seattle-animal-shelter-vet",
    name: "Seattle Animal Shelter — Veterinary Services",
    lat: 47.6685,
    lng: -122.3531,
    city: "Seattle",
    region: "Washington",
    country: "United States",
  },
  {
    id: "houston-barc-vet",
    name: "BARC Animal Shelter & Adoptions — Veterinary",
    lat: 29.7604,
    lng: -95.3698,
    city: "Houston",
    region: "Texas",
    country: "United States",
  },

  // ── United Kingdom ───────────────────────────────────────────
  {
    id: "pdsa-london-bow",
    name: "PDSA Pet Hospital — Bow",
    lat: 51.5273,
    lng: -0.0217,
    city: "London",
    region: "England",
    country: "United Kingdom",
  },
  {
    id: "pdsa-edinburgh",
    name: "PDSA Pet Hospital — Edinburgh",
    lat: 55.9533,
    lng: -3.1883,
    city: "Edinburgh",
    region: "Scotland",
    country: "United Kingdom",
  },
  {
    id: "blue-cross-manchester",
    name: "Blue Cross Animal Hospital — Manchester",
    lat: 53.4808,
    lng: -2.2426,
    city: "Manchester",
    region: "England",
    country: "United Kingdom",
  },
  {
    id: "bristol-animal-rescue-vet",
    name: "Bristol A.R.C. Veterinary Clinic",
    lat: 51.4545,
    lng: -2.5879,
    city: "Bristol",
    region: "England",
    country: "United Kingdom",
  },

  // ── Canada ───────────────────────────────────────────────────
  {
    id: "toronto-animal-services",
    name: "Toronto Animal Services — North Shelter",
    lat: 43.6532,
    lng: -79.3832,
    city: "Toronto",
    region: "Ontario",
    country: "Canada",
  },
  {
    id: "vancouver-animal-control",
    name: "Vancouver Animal Control",
    lat: 49.2827,
    lng: -123.1207,
    city: "Vancouver",
    region: "British Columbia",
    country: "Canada",
  },
  {
    id: "montreal-spca-vet",
    name: "SPCA de Montréal — Veterinary Clinic",
    lat: 45.5017,
    lng: -73.5673,
    city: "Montreal",
    region: "Quebec",
    country: "Canada",
  },

  // ── Australia ───────────────────────────────────────────────
  {
    id: "melbourne-council-animal",
    name: "Melbourne City Council — Animal Management",
    lat: -37.8136,
    lng: 144.9631,
    city: "Melbourne",
    region: "Victoria",
    country: "Australia",
  },
  {
    id: "brisbane-animal-mgmt",
    name: "Brisbane City Council — Animal Management",
    lat: -27.4698,
    lng: 153.0251,
    city: "Brisbane",
    region: "Queensland",
    country: "Australia",
  },
  {
    id: "perth-ranger-vet",
    name: "City of Perth — Ranger & Animal Services",
    lat: -31.9505,
    lng: 115.8605,
    city: "Perth",
    region: "Western Australia",
    country: "Australia",
  },

  // ── Japan ─────────────────────────────────────────────────────
  {
    id: "tokyo-metropolitan-vet",
    name: "Tokyo Metropolitan Veterinary Medical Center",
    lat: 35.6762,
    lng: 139.6503,
    city: "Tokyo",
    region: "Tokyo",
    country: "Japan",
  },
  {
    id: "osaka-city-vet",
    name: "Osaka City Veterinary Office",
    lat: 34.6937,
    lng: 135.5023,
    city: "Osaka",
    region: "Osaka",
    country: "Japan",
  },
  {
    id: "yokohama-city-vet",
    name: "Yokohama City Animal Welfare — Veterinary",
    lat: 35.4437,
    lng: 139.638,
    city: "Yokohama",
    region: "Kanagawa",
    country: "Japan",
  },

  // ── South Korea ───────────────────────────────────────────────
  {
    id: "seoul-metropolitan-vet",
    name: "Seoul Metropolitan Government — Veterinary Services",
    lat: 37.5665,
    lng: 126.978,
    city: "Seoul",
    region: "Seoul",
    country: "South Korea",
  },
  {
    id: "busan-metropolitan-vet",
    name: "Busan Metropolitan City — Veterinary Office",
    lat: 35.1796,
    lng: 129.0756,
    city: "Busan",
    region: "Busan",
    country: "South Korea",
  },

  // ── Thailand ──────────────────────────────────────────────────
  {
    id: "bangkok-metropolitan-vet",
    name: "Bangkok Metropolitan Administration — Veterinary",
    lat: 13.7563,
    lng: 100.5018,
    city: "Bangkok",
    region: "Bangkok",
    country: "Thailand",
  },
  {
    id: "chiang-mai-provincial-vet",
    name: "Chiang Mai Provincial Livestock Office",
    lat: 18.7883,
    lng: 98.9853,
    city: "Chiang Mai",
    region: "Chiang Mai",
    country: "Thailand",
  },

  // ── Singapore ─────────────────────────────────────────────────
  {
    id: "nparks-avs-singapore",
    name: "NParks Animal & Veterinary Service",
    lat: 1.3521,
    lng: 103.8198,
    city: "Singapore",
    region: "Singapore",
    country: "Singapore",
  },

  // ── Hong Kong ─────────────────────────────────────────────────
  {
    id: "hk-afcd-vet",
    name: "AFCD Veterinary Services",
    lat: 22.3964,
    lng: 114.1095,
    city: "Hong Kong",
    region: "New Territories",
    country: "Hong Kong",
  },

  // ── Germany ───────────────────────────────────────────────────
  {
    id: "berlin-veterinaeramt",
    name: "Veterinäramt Berlin",
    lat: 52.52,
    lng: 13.405,
    city: "Berlin",
    region: "Berlin",
    country: "Germany",
  },
  {
    id: "munich-veterinaeramt",
    name: "Veterinäramt München",
    lat: 48.1351,
    lng: 11.582,
    city: "Munich",
    region: "Bavaria",
    country: "Germany",
  },

  // ── France ────────────────────────────────────────────────────
  {
    id: "paris-ddpp-vet",
    name: "DDPP Paris — Services Vétérinaires",
    lat: 48.8566,
    lng: 2.3522,
    city: "Paris",
    region: "Île-de-France",
    country: "France",
  },
  {
    id: "lyon-vet-services",
    name: "DDPP Rhône — Services Vétérinaires",
    lat: 45.764,
    lng: 4.8357,
    city: "Lyon",
    region: "Auvergne-Rhône-Alpes",
    country: "France",
  },

  // ── Netherlands ───────────────────────────────────────────────
  {
    id: "amsterdam-dierenpolitie",
    name: "Dierenpolitie Amsterdam",
    lat: 52.3676,
    lng: 4.9041,
    city: "Amsterdam",
    region: "North Holland",
    country: "Netherlands",
  },

  // ── Spain ─────────────────────────────────────────────────────
  {
    id: "barcelona-sanidad-animal",
    name: "Ajuntament de Barcelona — Sanitat Animal",
    lat: 41.3874,
    lng: 2.1686,
    city: "Barcelona",
    region: "Catalonia",
    country: "Spain",
  },
  {
    id: "madrid-sanidad-animal",
    name: "Ayuntamiento de Madrid — Sanidad Animal",
    lat: 40.4168,
    lng: -3.7038,
    city: "Madrid",
    region: "Madrid",
    country: "Spain",
  },

  // ── Italy ─────────────────────────────────────────────────────
  {
    id: "milan-azienda-zoo",
    name: "Azienda Zootecnica — Comune di Milano",
    lat: 45.4642,
    lng: 9.19,
    city: "Milan",
    region: "Lombardy",
    country: "Italy",
  },
  {
    id: "rome-azienda-zoo",
    name: "Azienda Zootecnica — Roma Capitale",
    lat: 41.9028,
    lng: 12.4964,
    city: "Rome",
    region: "Lazio",
    country: "Italy",
  },

  // ── Mexico ────────────────────────────────────────────────────
  {
    id: "cdmx-sedema-vet",
    name: "SEDEMA CDMX — Servicios Veterinarios",
    lat: 19.4326,
    lng: -99.1332,
    city: "Mexico City",
    region: "CDMX",
    country: "Mexico",
  },

  // ── Brazil ────────────────────────────────────────────────────
  {
    id: "sao-paulo-ccz-vet",
    name: "CCZ São Paulo — Serviços Veterinários",
    lat: -23.5505,
    lng: -46.6333,
    city: "São Paulo",
    region: "São Paulo",
    country: "Brazil",
  },
  {
    id: "rio-ccz-vet",
    name: "CCZ Rio — Centro de Vigilância em Zoonoses",
    lat: -22.9068,
    lng: -43.1729,
    city: "Rio de Janeiro",
    region: "Rio de Janeiro",
    country: "Brazil",
  },

  // ── Argentina ─────────────────────────────────────────────────
  {
    id: "buenos-aires-zoonosis-vet",
    name: "Dirección de Zoonosis — Veterinaria",
    lat: -34.6037,
    lng: -58.3816,
    city: "Buenos Aires",
    region: "Buenos Aires",
    country: "Argentina",
  },

  // ── India ─────────────────────────────────────────────────────
  {
    id: "mumbai-spca-vet",
    name: "SPCA Mumbai — Veterinary Hospital",
    lat: 19.076,
    lng: 72.8777,
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
  },
  {
    id: "delhi-dspca-vet",
    name: "DSPCA Delhi — Veterinary Clinic",
    lat: 28.6139,
    lng: 77.209,
    city: "New Delhi",
    region: "Delhi",
    country: "India",
  },
  {
    id: "bangalore-cuppa-vet",
    name: "CUPA Bangalore — Veterinary Hospital",
    lat: 12.9716,
    lng: 77.5946,
    city: "Bangalore",
    region: "Karnataka",
    country: "India",
  },

  // ── United Arab Emirates ────────────────────────────────────────
  {
    id: "dubai-municipality-vet",
    name: "Dubai Municipality — Veterinary Services",
    lat: 25.2048,
    lng: 55.2708,
    city: "Dubai",
    region: "Dubai",
    country: "United Arab Emirates",
  },
  {
    id: "abu-dhabi-municipality-vet",
    name: "Abu Dhabi Municipality — Veterinary Services",
    lat: 24.4539,
    lng: 54.3773,
    city: "Abu Dhabi",
    region: "Abu Dhabi",
    country: "United Arab Emirates",
  },

  // ── New Zealand ─────────────────────────────────────────────────
  {
    id: "auckland-council-animal",
    name: "Auckland Council — Animal Management",
    lat: -36.8485,
    lng: 174.7633,
    city: "Auckland",
    region: "Auckland",
    country: "New Zealand",
  },
  {
    id: "wellington-spca-vet",
    name: "SPCA Wellington — Veterinary Clinic",
    lat: -41.2865,
    lng: 174.7762,
    city: "Wellington",
    region: "Wellington",
    country: "New Zealand",
  },

  // ── South Africa ────────────────────────────────────────────────
  {
    id: "cape-town-state-vet",
    name: "Western Cape State Veterinary Services",
    lat: -33.9249,
    lng: 18.4241,
    city: "Cape Town",
    region: "Western Cape",
    country: "South Africa",
  },
  {
    id: "johannesburg-spca-vet",
    name: "SPCA Johannesburg — Veterinary Clinic",
    lat: -26.2041,
    lng: 28.0473,
    city: "Johannesburg",
    region: "Gauteng",
    country: "South Africa",
  },

  // ── Ireland ─────────────────────────────────────────────────────
  {
    id: "dublin-dspca-vet",
    name: "DSPCA Dublin — Veterinary Hospital",
    lat: 53.3498,
    lng: -6.2603,
    city: "Dublin",
    region: "Leinster",
    country: "Ireland",
  },

  // ── Poland ──────────────────────────────────────────────────────
  {
    id: "warsaw-vet-inspection",
    name: "Inspekcja Weterynaryjna — Warszawa",
    lat: 52.2297,
    lng: 21.0122,
    city: "Warsaw",
    region: "Mazovia",
    country: "Poland",
  },

  // ── Turkey ──────────────────────────────────────────────────────
  {
    id: "istanbul-vet-services",
    name: "İstanbul İl Tarım ve Orman Müdürlüğü — Veteriner",
    lat: 41.0082,
    lng: 28.9784,
    city: "Istanbul",
    region: "Istanbul",
    country: "Turkey",
  },

  // ── Sweden ──────────────────────────────────────────────────────
  {
    id: "stockholm-djurvard",
    name: "Stockholm Stad — Djurvård",
    lat: 59.3293,
    lng: 18.0686,
    city: "Stockholm",
    region: "Stockholm",
    country: "Sweden",
  },

  // ── Norway ──────────────────────────────────────────────────────
  {
    id: "oslo-dyrevern",
    name: "Oslo Kommune — Dyrevern",
    lat: 59.9139,
    lng: 10.7522,
    city: "Oslo",
    region: "Oslo",
    country: "Norway",
  },

  // ── Greece ──────────────────────────────────────────────────────
  {
    id: "athens-municipal-vet",
    name: "Δήμος Αθηναίων — Κτηνιατρικές Υπηρεσίες",
    lat: 37.9838,
    lng: 23.7275,
    city: "Athens",
    region: "Attica",
    country: "Greece",
  },
];
