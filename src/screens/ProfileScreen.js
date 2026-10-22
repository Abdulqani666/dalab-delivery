import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import { Button } from '../ui';
import { colors } from '../theme';
import { APP_NAME } from '../config';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: 16 }}>
        <Text style={s.title}>Profile</Text>
        <View style={s.card}>
          <Text style={s.name}>{profile?.name}</Text>
          <Text style={s.muted}>+{profile?.phone}</Text>
          {profile?.role !== 'customer' ? <Text style={s.role}>{profile?.role}</Text> : null}
        </View>
        <Button title="Log out" color={colors.danger} onPress={signOut} style={{ marginTop: 20 }} />
        <Text style={s.version}>{APP_NAME} · version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16 },
  name: { color: colors.text, fontSize: 20, fontWeight: '700' },
  muted: { color: colors.muted, marginTop: 4 },
  role: { color: colors.orange, marginTop: 8, fontWeight: '700', textTransform: 'capitalize' },
  version: { color: colors.muted, textAlign: 'center', marginTop: 30, fontSize: 12 },
});
