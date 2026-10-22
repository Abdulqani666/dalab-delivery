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
import { useAuth } from '../AuthContext';
import { Button, Field } from '../ui';
import { colors } from '../theme';
import { APP_NAME } from '../config';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 7) return Alert.alert('Phone number', 'Enter your phone number with the country code.');
    if (password.length < 6) return Alert.alert('Password', 'Password must have at least 6 characters.');
    if (mode === 'signup' && name.trim().length < 2) return Alert.alert('Name', 'Enter your name.');

    setBusy(true);
    try {
      if (mode === 'signup') await signUp(name, phone, password);
      else await signIn(phone, password);
    } catch (e) {
      const m = String(e?.message || '').toLowerCase();
      let msg = 'Something went wrong. Try again.';
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{APP_NAME}</Text>
        <Text style={s.sub}>Fast. Reliable. On time.</Text>

        {mode === 'signup' && (
          <Field placeholder="Your name" value={name} onChangeText={setName} style={s.gap} />
        )}
        <Field
          placeholder="Phone number (e.g. 252 90 123 4567)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={s.gap}
        />
        <Field
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={s.gap}
        />

        <Button
          title={mode === 'signup' ? 'Create account' : 'Log in'}
          onPress={submit}
          loading={busy}
          style={{ marginTop: 18 }}
        />

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ marginTop: 22 }}>
          <Text style={s.link}>
            {mode === 'login' ? "New here? Create an account" : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  title: { color: colors.orange, fontSize: 34, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', marginBottom: 32, marginTop: 4 },
  gap: { marginTop: 12 },
  link: { color: colors.teal, textAlign: 'center', fontSize: 15 },
});
