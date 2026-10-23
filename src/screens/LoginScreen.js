import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import { Button, Field } from '../ui';
import { colors, radius, type } from '../theme';
import { APP_NAME } from '../config';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (mode === 'signup' && name.trim().length < 2) return Alert.alert('Your name', 'Please enter your name.');
    if (digits.length < 7) return Alert.alert('Phone number', 'Enter your phone number, for example 252 90 123 4567.');
    if (password.length < 6) return Alert.alert('Password', 'Your password needs at least 6 characters.');

    setBusy(true);
    try {
      if (mode === 'signup') await signUp(name, phone, password);
      else await signIn(phone, password);
    } catch (e) {
      const m = String(e?.message || '').toLowerCase();
      let msg = 'Something went wrong. Please try again.';
      if (m.includes('already registered')) msg = 'This phone number already has an account. Please log in.';
      else if (m.includes('invalid login')) msg = 'Wrong phone number or password.';
      else if (m.includes('confirm email'))
        msg = 'Setup problem: in Supabase turn OFF "Confirm email" (Authentication > Sign In / Providers > Email).';
      else if (m.includes('network') || m.includes('fetch')) msg = 'No internet connection.';
      Alert.alert('Could not continue', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.brand}>
            <View style={s.logo}>
              <Ionicons name="bicycle" size={40} color={colors.onAccent} />
            </View>
            <Text style={s.title}>{APP_NAME}</Text>
            <Text style={s.tagline}>Fast. Reliable. On time.</Text>
          </View>

          <View style={s.tabs}>
            {[
              ['login', 'Log in'],
              ['signup', 'Create account'],
            ].map(([key, label]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setMode(key)}
                style={[s.tab, mode === key && s.tabOn]}
                activeOpacity={0.85}
              >
                <Text style={[s.tabText, mode === key && s.tabTextOn]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ gap: 12 }}>
            {mode === 'signup' && (
              <Field icon="person-outline" placeholder="Your name" value={name} onChangeText={setName} />
            )}
            <Field
              icon="call-outline"
              placeholder="Phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <View>
              <Field
                icon="lock-closed-outline"
                placeholder="Password"
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eye} hitSlop={10}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title={mode === 'signup' ? 'Create account' : 'Log in'}
            onPress={submit}
            loading={busy}
            style={{ marginTop: 22 }}
          />

          <Text style={s.foot}>
            {mode === 'login' ? 'New to Dalab Delivery? ' : 'Already have an account? '}
            <Text style={s.footLink} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { ...type.title, color: colors.text },
  tagline: { color: colors.muted, marginTop: 4, fontSize: 15 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: radius.sm },
  tabOn: { backgroundColor: colors.surface2 },
  tabText: { color: colors.muted, fontWeight: '700' },
  tabTextOn: { color: colors.text },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  foot: { color: colors.muted, textAlign: 'center', marginTop: 22, fontSize: 14 },
  footLink: { color: colors.orange, fontWeight: '700' },
});
