export type FeaturedVet = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  website?: string;
  blurb?: string;
};

/** Curated well-known veterinary hospitals / animal hospitals. */
export const FEATURED_VETS: FeaturedVet[] = [
  {
    id: "angell-boston",
    name: "Angell Animal Medical Center",
    lat: 42.3369,
    lng: -71.107,
    city: "Boston",
    country: "United States",
    website: "https://www.mspca.org/angell",
    blurb: "One of America's leading nonprofit animal hospitals.",
  },
  {
    id: "blue-cross-london",
    name: "Blue Cross Animal Hospital",
    lat: 51.4925,
    lng: -0.1486,
    city: "London",
    country: "United Kingdom",
    website: "https://www.bluecross.org.uk",
    blurb: "Historic UK animal welfare veterinary hospital.",
  },
  {
    id: "u-vet-sydney",
    name: "Sydney University Veterinary Teaching Hospital",
    lat: -33.8886,
    lng: 151.1873,
    city: "Sydney",
    country: "Australia",
    blurb: "Major referral and emergency animal hospital in Sydney.",
  },
  {
    id: "jikei-tokyo",
    name: "Jikei University Animal Medical Center",
    lat: 35.6369,
    lng: 139.7286,
    city: "Tokyo",
    country: "Japan",
    blurb: "Leading veterinary teaching hospital in Tokyo.",
  },
  {
    id: "long-paws-manila",
    name: "Veterinary Teaching Hospital UP Los Baños",
    lat: 14.1667,
    lng: 121.2419,
    city: "Los Baños",
    country: "Philippines",
    blurb: "University of the Philippines veterinary teaching hospital.",
  },
  {
    id: "animal-house-makati",
    name: "Animal House Veterinary Hospital",
    lat: 14.5548,
    lng: 121.0244,
    city: "Makati",
    country: "Philippines",
    blurb: "24-hour veterinary hospital serving Metro Manila.",
  },
  {
    id: "vet-in-practice-singapore",
    name: "Veterinary Emergency & Specialty Hospital Singapore",
    lat: 1.3048,
    lng: 103.8318,
    city: "Singapore",
    country: "Singapore",
    blurb: "Specialist and emergency veterinary care in Singapore.",
  },
  {
    id: "bkk-vet-bangkok",
    name: "Bangkok Animal Hospital",
    lat: 13.7563,
    lng: 100.5018,
    city: "Bangkok",
    country: "Thailand",
    blurb: "Well-known companion animal hospital in central Bangkok.",
  },
];
