import React from 'react';
import {
  TouchableOpacity,
  Text,
  TextInput,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type } from './theme';

// ---------- Button ----------
// variant: primary (orange) | secondary (outlined) | success | danger | ghost
export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, small, style }) {
  const v = {
    primary: { bg: colors.orange, fg: colors.onAccent, border: colors.orange },
    secondary: { bg: 'transparent', fg: colors.text, border: colors.border },
    success: { bg: colors.ok, fg: '#04150c', border: colors.ok },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
    ghost: { bg: colors.surface2, fg: colors.text, border: colors.surface2 },
  }[variant];
  const off = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={off}
      activeOpacity={0.85}
      style={[
        s.btn,
        small && s.btnSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        off && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={s.btnRow}>
          {icon ? <Ionicons name={icon} size={small ? 16 : 19} color={v.fg} style={{ marginRight: 7 }} /> : null}
          <Text style={[s.btnText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------- Text field with optional icon ----------
export function Field({ icon, style, inputStyle, ...props }) {
  return (
    <View style={[s.field, style]}>
      {icon ? <Ionicons name={icon} size={19} color={colors.muted} style={{ marginRight: 10 }} /> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.orange}
        {...props}
        style={[s.input, inputStyle]}
      />
    </View>
  );
}

// ---------- Card ----------
export function Card({ children, style, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.card, style]}
    >
      {children}
    </Wrap>
  );
}

// ---------- Pill (small status label) ----------
export function Pill({ label, color = colors.teal, bg = colors.tealSoft, icon, style }) {
  return (
    <View style={[s.pill, { backgroundColor: bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} /> : null}
      <Text style={[s.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ---------- Section heading ----------
export function SectionTitle({ title, action, onAction, style }) {
  return (
    <View style={[s.sectionRow, style]}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ---------- Empty state ----------
export function EmptyState({ icon = 'file-tray-outline', title, text, children }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={32} color={colors.muted} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {text ? <Text style={s.emptyText}>{text}</Text> : null}
      {children}
    </View>
  );
}

// ---------- Round avatar with initials ----------
export function Avatar({ name = '', size = 56 }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.38 }]}>{initials || '?'}</Text>
    </View>
  );
}

// ---------- Floating bar at the bottom (cart / checkout) ----------
export function BottomBar({ label, value, onPress, icon = 'bag-handle' }) {
  return (
    <TouchableOpacity style={s.bar} onPress={onPress} activeOpacity={0.9}>
      <View style={s.barLeft}>
        <View style={s.barIcon}>
          <Ionicons name={icon} size={18} color={colors.onAccent} />
        </View>
        <Text style={s.barText}>{label}</Text>
      </View>
      <Text style={s.barText}>{value}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: { minHeight: 42, paddingHorizontal: 14, borderRadius: radius.sm },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 10 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 12, fontWeight: '700' },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...type.h2, color: colors.text },
  sectionAction: { color: colors.orange, fontWeight: '700', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { ...type.h2, color: colors.text, textAlign: 'center' },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  avatar: { backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.orange, fontWeight: '800' },

  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  barLeft: { flexDirection: 'row', alignItems: 'center' },
  barIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(26,18,4,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  barText: { color: colors.onAccent, fontWeight: '800', fontSize: 16 },
});
