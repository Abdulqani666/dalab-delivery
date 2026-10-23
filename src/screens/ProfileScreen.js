import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { Avatar, Button, Card, Pill } from '../ui';
import { colors, radius, type } from '../theme';
import { APP_NAME } from '../config';

function Row({ icon, label, value }) {
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.orange} />
      </View>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const role = profile?.role || 'customer';

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You can log back in with your phone number and password.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={{ padding: 16, gap: 16 }}>
        <Text style={s.title}>Profile</Text>

        <Card style={s.hero}>
          <Avatar name={profile?.name} size={72} />
          <Text style={s.name}>{profile?.name || 'Your account'}</Text>
          {role !== 'customer' ? (
            <Pill
              label={role === 'admin' ? 'Admin' : 'Rider'}
              color={colors.orange}
              bg={colors.orangeSoft}
              icon={role === 'admin' ? 'shield-checkmark' : 'bicycle'}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <Row icon="call" label="Phone" value={profile?.phone ? `+${profile.phone}` : '—'} />
          <View style={s.sep} />
          <Row icon="person" label="Account type" value={role === 'customer' ? 'Customer' : role === 'admin' ? 'Admin' : 'Rider'} />
          <View style={s.sep} />
          <Row icon="cash" label="Payment" value="Cash on delivery" />
        </Card>

        <Button title="Log out" icon="log-out-outline" variant="danger" onPress={confirmLogout} />

        <Text style={s.version}>
          {APP_NAME} · version 1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { ...type.title, color: colors.text },
  hero: { alignItems: 'center', paddingVertical: 24 },
  name: { ...type.h1, color: colors.text, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: { color: colors.muted, fontSize: 15, flex: 1 },
  rowValue: { color: colors.text, fontWeight: '700', fontSize: 15, maxWidth: '55%' },
  sep: { height: 1, backgroundColor: colors.border },
  version: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 4 },
});
