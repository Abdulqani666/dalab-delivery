import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { colors } from '../theme';
import { Field } from '../ui';
import { CATEGORIES, APP_NAME } from '../config';
import { useCart } from '../CartContext';
import { money, toShop } from '../utils';

export default function HomeScreen({ navigation }) {
  const [shops, setShops] = useState(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const { count, subtotal, shop: cartShop } = useCart();

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('shops').select('*').order('name');
    if (err) {
      setError(true);
      return;
    }
    setError(false);
    setShops(data.map(toShop));
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  const visible = useMemo(() => {
    if (!shops) return [];
    const term = q.trim().toLowerCase();
    return shops
      .filter((s) => s.isOpen !== false)
      .filter((s) => cat === 'All' || s.category === cat)
      .filter((s) => !term || (s.name || '').toLowerCase().includes(term));
  }, [shops, q, cat]);

  return (
    <SafeAreaView style={s.wrap} edges={['top']}>
      <View style={s.header}>
        <Text style={s.brand}>{APP_NAME}</Text>
        <Field placeholder="Search restaurants and shops…" value={q} onChangeText={setQ} style={{ marginTop: 10 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCat(c)}
              style={[s.chip, cat === c && { backgroundColor: colors.orange, borderColor: colors.orange }]}
            >
              <Text style={[s.chipText, cat === c && { color: '#fff' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {shops === null && !error ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={s.empty}>Could not load shops. Check your internet and the Supabase setup.</Text>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          onRefresh={load}
          refreshing={false}
          ListEmptyComponent={<Text style={s.empty}>No shops found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Shop', { shop: item })}>
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={s.logo} resizeMode="cover" />
              ) : (
                <View style={[s.logo, s.logoEmpty]}>
                  <Ionicons name="storefront" size={40} color={colors.muted} />
                </View>
              )}
              <Text style={s.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={s.cat}>{item.category}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {count > 0 && cartShop ? (
        <TouchableOpacity
          style={s.cartBar}
          onPress={() => navigation.navigate('Shop', { shop: cartShop })}
          activeOpacity={0.9}
        >
          <Text style={s.cartText}>
            View cart · {count} item{count > 1 ? 's' : ''}
          </Text>
          <Text style={s.cartText}>{money(subtotal)}</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  brand: { color: colors.orange, fontSize: 24, fontWeight: '800' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  chipText: { color: colors.muted, fontWeight: '600' },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  logo: { width: '100%', height: 110, borderRadius: 12, backgroundColor: '#fff' },
  logoEmpty: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 8 },
  cat: { color: colors.muted, marginTop: 2 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.orange,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
