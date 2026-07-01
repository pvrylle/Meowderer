export type RegionalShelter = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  country: string;
};

/** Known local shelters/rescue groups — supplements sparse OpenStreetMap data. */
export const REGIONAL_SHELTERS: RegionalShelter[] = [
  // Zambales / Subic / Olongapo
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
    id: "bataan-animal-welfare",
    name: "Bataan Animal Welfare and Rescue",
    lat: 14.676,
    lng: 120.5369,
    city: "Balanga",
    region: "Bataan",
    country: "Philippines",
  },
  // Metro Manila & nearby
  {
    id: "mandaluyong-animal-shelter",
    name: "Mandaluyong Animal Shelter",
    lat: 14.5832,
    lng: 121.0359,
    city: "Mandaluyong",
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
    id: "marikina-animal-shelter",
    name: "Marikina City Animal Shelter",
    lat: 14.6507,
    lng: 121.1029,
    city: "Marikina",
    region: "Metro Manila",
    country: "Philippines",
  },
  {
    id: "taguig-animal-shelter",
    name: "Taguig City Animal Shelter",
    lat: 14.5176,
    lng: 121.0509,
    city: "Taguig",
    region: "Metro Manila",
    country: "Philippines",
  },
  {
    id: "paranaque-animal-shelter",
    name: "Parañaque City Animal Shelter",
    lat: 14.4793,
    lng: 121.0198,
    city: "Parañaque",
    region: "Metro Manila",
    country: "Philippines",
  },
  {
    id: "phil-animal-rescue",
    name: "Philippine Animal Rescue Society",
    lat: 14.5995,
    lng: 121.0367,
    city: "Manila",
    region: "Metro Manila",
    country: "Philippines",
  },
  // Other Luzon
  {
    id: "angeles-city-vet",
    name: "Angeles City Veterinary Office",
    lat: 15.1455,
    lng: 120.593,
    city: "Angeles",
    region: "Pampanga",
    country: "Philippines",
  },
  {
    id: "baguio-animal-shelter",
    name: "Baguio City Animal Shelter",
    lat: 16.4023,
    lng: 120.596,
    city: "Baguio",
    region: "Benguet",
    country: "Philippines",
  },
  // Visayas / Mindanao samples
  {
    id: "cebu-city-vet",
    name: "Cebu City Veterinary Office",
    lat: 10.3157,
    lng: 123.8854,
    city: "Cebu City",
    region: "Cebu",
    country: "Philippines",
  },
  {
    id: "davao-animal-rescue",
    name: "Davao Animal Rescue Volunteers",
    lat: 7.0731,
    lng: 125.6128,
    city: "Davao City",
    region: "Davao del Sur",
    country: "Philippines",
  },
];
