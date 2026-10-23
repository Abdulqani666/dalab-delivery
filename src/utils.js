import { CURRENCY, DELIVERY } from './config';
import { colors } from './theme';

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

export const money = (n) => `${CURRENCY}${Number(n || 0).toFixed(2)}`;

export const STATUS = {
  new: { label: 'Waiting for a rider', short: 'New', step: 0, icon: 'time', color: colors.orange, bg: colors.orangeSoft },
  accepted: { label: 'Rider is heading to the shop', short: 'Accepted', step: 1, icon: 'storefront', color: colors.info, bg: colors.infoSoft },
  picked_up: { label: 'On the way to you', short: 'On the way', step: 2, icon: 'bicycle', color: colors.teal, bg: colors.tealSoft },
  delivered: { label: 'Delivered', short: 'Delivered', step: 3, icon: 'checkmark-circle', color: colors.ok, bg: colors.okSoft },
  cancelled: { label: 'Cancelled', short: 'Cancelled', step: -1, icon: 'close-circle', color: colors.danger, bg: colors.dangerSoft },
};

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${time}`;
}

export function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}
