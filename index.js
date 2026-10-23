import { registerRootComponent } from 'expo';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

// DIAGNOSTIC BUILD: tap each button. A line turns OK or shows the error. If the app closes, that item is the problem.
const tests = [
  ['1 expo-font', () => { require('expo-font'); return 'loaded'; }],
  ['2 vector-icons', () => { require('@expo/vector-icons'); return 'loaded'; }],
  ['3 async-storage', () => { const m = require('@react-native-async-storage/async-storage').default; return typeof m.getItem; }],
  ['4 safe-area-context', () => { require('react-native-safe-area-context'); return 'loaded'; }],
  ['5 react-native-screens', () => { require('react-native-screens'); return 'loaded'; }],
  ['6 react-navigation', () => { require('@react-navigation/native'); require('@react-navigation/native-stack'); require('@react-navigation/bottom-tabs'); return 'loaded'; }],
  ['7 expo-location', () => { require('expo-location'); return 'loaded'; }],
  ['8 url-polyfill + supabase client', () => { const { supabase } = require('./src/supabase'); return typeof supabase.auth.getSession; }],
  ['9 react-native-maps (load)', () => { require('react-native-maps'); return 'loaded'; }],
  ['10 whole app (App.js)', () => { require('./App'); return 'loaded'; }],
];

function Diag() {
  const [res, setRes] = useState({});
  const [showMap, setShowMap] = useState(false);
  const run = (name, fn) => {
    setRes((r) => ({ ...r, [name]: 'running…' }));
    try {
      const out = fn();
      setRes((r) => ({ ...r, [name]: 'OK ' + out }));
    } catch (e) {
      setRes((r) => ({ ...r, [name]: 'FAIL ' + String((e && e.message) || e).slice(0, 300) }));
    }
  };
  const MapView = showMap ? require('react-native-maps').default : null;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000' }}>Dalab Delivery diagnostic</Text>
      <Text style={{ color: '#000', marginBottom: 10 }}>The app opened. Tap each button from 1 to 11. Tell me the first one that closes the app or says FAIL.</Text>
      {tests.map(([name, fn]) => (
        <TouchableOpacity key={name} onPress={() => run(name, fn)} style={{ borderWidth: 1, borderColor: '#000', padding: 12, marginBottom: 8 }}>
          <Text style={{ color: '#000', fontWeight: 'bold' }}>{name}</Text>
          <Text style={{ color: res[name] && res[name].startsWith('FAIL') ? '#b00020' : '#000' }}>{res[name] || 'tap to test'}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => setShowMap(true)} style={{ borderWidth: 1, borderColor: '#000', padding: 12, marginBottom: 8 }}>
        <Text style={{ color: '#000', fontWeight: 'bold' }}>11 show a map</Text>
        <Text style={{ color: '#000' }}>{showMap ? 'map below' : 'tap to test'}</Text>
      </TouchableOpacity>
      {MapView ? <MapView style={{ height: 200 }} /> : null}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

registerRootComponent(Diag);
