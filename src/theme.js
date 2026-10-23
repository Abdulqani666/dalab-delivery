// Dalab Delivery design tokens. Dark teal base, orange for actions.
export const colors = {
  bg: '#0b1415',
  surface: '#121f20',
  surface2: '#182b2c',
  card: '#121f20', // kept for older code
  border: '#223a3a',
  text: '#f4f7f7',
  muted: '#8ea3a2',
  orange: '#f29b1d',
  orangeSoft: 'rgba(242,155,29,0.14)',
  teal: '#1f9e8b',
  tealSoft: 'rgba(31,158,139,0.16)',
  info: '#4a9fe0',
  infoSoft: 'rgba(74,159,224,0.16)',
  ok: '#35b27a',
  okSoft: 'rgba(53,178,122,0.16)',
  danger: '#e5534b',
  dangerSoft: 'rgba(229,83,75,0.16)',
  onAccent: '#1a1204',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.2 },
  h2: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '700' },
  small: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
};

// Icon and tint for each shop category.
export const categoryStyle = {
  All: { icon: 'apps', color: '#5b7f86' },
  Food: { icon: 'restaurant', color: '#1f9e8b' },
  Supermarket: { icon: 'cart', color: '#2a8f9e' },
  Electronics: { icon: 'phone-portrait', color: '#3f6fb5' },
  Clothes: { icon: 'shirt', color: '#9b4a8f' },
  Stationery: { icon: 'pencil', color: '#2f8f83' },
  'Gas & Fuel': { icon: 'flame', color: '#d6562b' },
  Other: { icon: 'cube', color: '#5a6b7b' },
};
