export const MERCHANT_CATEGORIES = [
  { id: "all", label: "Todos", color: "#f7931a" },
  { id: "food", label: "Gastronomía", color: "#f97316" },
  { id: "shopping", label: "Compras", color: "#12a150" },
  { id: "services", label: "Servicios", color: "#4a90d9" },
  { id: "health", label: "Salud y bienestar", color: "#a855f7" },
  { id: "travel", label: "Alojamiento y turismo", color: "#0ea5e9" },
  { id: "finance", label: "Bitcoin y finanzas", color: "#f6b40e" },
  { id: "other", label: "Otros", color: "#64748b" },
] as const;

export type MerchantCategory = (typeof MERCHANT_CATEGORIES)[number]["id"];
export type FilterableMerchantCategory = Exclude<MerchantCategory, "all">;

const ICON_CATEGORIES: Record<string, FilterableMerchantCategory> = {
  restaurant: "food",
  local_pizza: "food",
  lunch_dining: "food",
  local_cafe: "food",
  coffee: "food",
  bakery_dining: "food",
  local_bar: "food",
  wine_bar: "food",
  liquor: "food",
  sports_bar: "food",
  nightlife: "food",
  icecream: "food",
  fastfood: "food",
  ramen_dining: "food",
  brunch_dining: "food",
  cake: "food",
  storefront: "shopping",
  local_mall: "shopping",
  local_grocery_store: "shopping",
  local_florist: "shopping",
  shopping_bag: "shopping",
  shopping_cart: "shopping",
  computer: "shopping",
  smartphone: "shopping",
  phone_iphone: "shopping",
  luggage: "shopping",
  card_giftcard: "shopping",
  chair: "shopping",
  diamond: "shopping",
  watch: "shopping",
  games: "shopping",
  menu_book: "shopping",
  hardware: "shopping",
  pets: "shopping",
  checkroom: "shopping",
  palette: "shopping",
  business: "services",
  group: "services",
  home: "services",
  design_services: "services",
  photo_camera: "services",
  local_printshop: "services",
  newspaper: "services",
  directions_car: "services",
  two_wheeler: "services",
  directions_boat: "services",
  local_taxi: "services",
  car_repair: "services",
  architecture: "services",
  colorize: "services",
  construction: "services",
  school: "services",
  child_care: "services",
  local_laundry_service: "services",
  edit: "services",
  public: "services",
  medical_services: "health",
  content_cut: "health",
  spa: "health",
  fitness_center: "health",
  local_pharmacy: "health",
  dentistry: "health",
  visibility: "health",
  pool: "health",
  sports: "health",
  hotel: "travel",
  chalet: "travel",
  bed: "travel",
  cabin: "travel",
  beach_access: "travel",
  tour: "travel",
  grass: "travel",
  hiking: "travel",
  local_atm: "finance",
  currency_exchange: "finance",
  account_balance: "finance",
  payments: "finance",
  currency_bitcoin: "finance",
};

export interface MerchantPaymentMethods {
  bitcoin: true;
  onchain: boolean;
  lightning: boolean;
  contactless: boolean;
}

export interface Merchant {
  id: number;
  lat: number;
  lon: number;
  icon: string;
  category: FilterableMerchantCategory;
  name: string;
  address?: string;
  description?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  email?: string;
  image?: string;
  osmUrl?: string;
  verifiedAt?: string;
  requiredAppUrl?: string;
  paymentProvider?: string;
  payments: MerchantPaymentMethods;
}

export interface GooglePhoto {
  photoUri: string;
  googleMapsUri?: string;
  authors: { displayName: string; uri?: string; photoUri?: string }[];
}

export interface GooglePlaceEnrichment {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri: string;
  photos: GooglePhoto[];
}

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const urlValue = (value: unknown): string | undefined => {
  const candidate = stringValue(value);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const instagramValue = (value: unknown): string | undefined => {
  const candidate = stringValue(value);
  if (!candidate) return undefined;
  const direct = urlValue(candidate);
  if (direct) return direct;
  const handle = candidate.replace(/^@/, "");
  return /^[a-z0-9._]{1,30}$/i.test(handle)
    ? `https://www.instagram.com/${handle}/`
    : undefined;
};

const accepts = (value: unknown) =>
  typeof value === "string" && ["yes", "only"].includes(value.toLowerCase());

export function merchantCategory(icon: string | undefined): FilterableMerchantCategory {
  return (icon && ICON_CATEGORIES[icon]) || "other";
}

export function merchantCategoryInfo(category: FilterableMerchantCategory) {
  return MERCHANT_CATEGORIES.find((item) => item.id === category)!;
}

export function normalizeMerchant(value: unknown): Merchant | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = Number(raw.id);
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180 ||
    raw.deleted_at
  ) {
    return null;
  }

  const icon = stringValue(raw.icon) ?? "storefront";
  return {
    id,
    lat,
    lon,
    icon,
    category: merchantCategory(icon),
    name: stringValue(raw.name) ?? "Comercio sin nombre",
    address: stringValue(raw.address),
    description: stringValue(raw.description),
    openingHours: stringValue(raw.opening_hours),
    phone: stringValue(raw.phone) ?? stringValue(raw["osm:contact:phone"]),
    website: urlValue(raw.website) ?? urlValue(raw["osm:contact:website"]),
    instagram:
      instagramValue(raw.instagram) ?? instagramValue(raw["osm:contact:instagram"]),
    email: stringValue(raw.email) ?? stringValue(raw["osm:contact:email"]),
    image: urlValue(raw.image),
    osmUrl: urlValue(raw.osm_url),
    verifiedAt: stringValue(raw.verified_at),
    requiredAppUrl: urlValue(raw.required_app_url),
    paymentProvider: stringValue(raw.payment_provider),
    payments: {
      bitcoin: true,
      onchain: accepts(raw["osm:payment:onchain"]),
      lightning: accepts(raw["osm:payment:lightning"]),
      contactless: accepts(raw["osm:payment:lightning_contactless"]),
    },
  };
}

const normalizeWords = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => word.length > 1);

export function distanceMeters(
  a: Pick<Merchant, "lat" | "lon">,
  b: { latitude: number; longitude: number },
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(b.latitude - a.lat);
  const dLon = radians(b.longitude - a.lon);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isConfidentGoogleMatch(
  merchant: Pick<Merchant, "name" | "lat" | "lon">,
  candidate: { displayName?: string; location?: { latitude: number; longitude: number } },
) {
  if (!candidate.displayName || !candidate.location) return false;
  if (distanceMeters(merchant, candidate.location) > 250) return false;

  const wanted = normalizeWords(merchant.name);
  const found = new Set(normalizeWords(candidate.displayName));
  if (!wanted.length || !found.size) return false;
  const overlap = wanted.filter((word) => found.has(word)).length / wanted.length;
  const wantedText = wanted.join(" ");
  const foundText = [...found].join(" ");
  return overlap >= 0.5 || wantedText.includes(foundText) || foundText.includes(wantedText);
}
