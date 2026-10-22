import { CURRENCY, DELIVERY } from './config';

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function deliveryFee(shopLoc, dropLoc) {
  if (!shopLoc || !dropLoc) return DELIVERY.minFee;
  const km = haversineKm(shopLoc, dropLoc);
  const fee = DELIVERY.baseFee + DELIVERY.perKm * km;
  // round to nearest 0.25
  return Math.max(DELIVERY.minFee, Math.round(fee * 4) / 4);
}

// Database row -> object the screens use
export function toShop(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    logoUrl: row.logo_url,
    isOpen: row.is_open,
    location: { latitude: row.latitude, longitude: row.longitude },
  };
}

export const money =(n) => `${CURRENCY}${Number(n || 0).toFixed(2)}`;

export const STATUS = {
  new: { label: 'Waiting for rider', step: 0 },
  accepted: { label: 'Rider is going to the shop', step: 1 },
  picked_up: { label: 'On the way to you', step: 2 },
  delivered: { label: 'Delivered', step: 3 },
  cancelled: { label: 'Cancelled', step: -1 },
};
