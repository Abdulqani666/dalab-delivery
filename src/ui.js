import React from 'react';
import { TouchableOpacity, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from './theme';

export function Button({ title, onPress, color = colors.orange, loading, disabled, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[s.btn, { backgroundColor: color }, (disabled || loading) && { opacity: 0.5 }, style]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function Field(props) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[s.field, props.style]} />;
}

const s = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  field: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
  },
});
