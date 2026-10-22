// ---- Dalab Delivery settings. Change the values here, nowhere else. ----

export const APP_NAME = 'Dalab Delivery';
export const CURRENCY = '$';

// Delivery fee = baseFee + perKm * distance(shop -> customer), never below minFee.
export const DELIVERY = {
  baseFee: 0.5,
  perKm: 0.5,
  minFee: 1,
};

// Map starts here if the phone location is not available. (Garowe)
export const DEFAULT_REGION = {
  latitude: 8.4054,
  longitude: 48.4845,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Supabase: Project Settings > API. Paste the Project URL and the "anon / publishable" key.
// Never paste the "service_role" key in the app.
export const SUPABASE_URL = 'https://eeqwwmksfdhqnxedseou.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_YvkqajAyTQN3xxNAZhikNw_xoKbA23u';

export const CATEGORIES = [
  'All',
  'Food',
  'Supermarket',
  'Electronics',
  'Clothes',
  'Stationery',
  'Gas & Fuel',
  'Other',
];
