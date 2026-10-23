import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { colors, radius, type, categoryStyle } from '../theme';
import { Field, Pill, SectionTitle, EmptyState, BottomBar, Button } from '../ui';
import { CATEGORIES } from '../config';
import { money, toShop, firstName } from '../utils';

const TILES = CATEGORIES; // "All" first, then each category

function ShopCard({ shop, onPress }) {
  const cs = categoryStyle[shop.category] || categoryStyle.Other;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {shop.logoUrl ? (
        <Image source={{ uri: shop.logoUrl }} style={s.logo} resizeMode="cover" />
      ) : (
        <View style={[s.logo, { backgroundColor: cs.color }]}>
          <Text style={s.logoLetter}>{(shop.name || '?').trim()[0]?.toUpperCase()}</Text>
        </View>
      )}
      <Text style={s.shopName} numberOfLines={1}>
        {shop.name}
      </Text>
      <View style={s.metaRow}>
        <Ionicons name={cs.icon} size={13} color={colors.muted} />
        <Text style={s.metaText} numberOfLines={1}>
          {shop.category}
        </Text>
      </View>
      <Pill label="Open" color={colors.ok} bg={colors.okSoft} style={{ marginTop: 8 }} />
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const { count, subtotal, shop: cartShop } = useCart();
  const [shops, setShops] = useState(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

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
    return navigation.addListener('focus', load);
  }, [load, navigation]);

  const visible = useMemo(() => {
    if (!shops) return [];
    const term = q.trim().toLowerCase();
    return shops
      .filter((x) => x.isOpen !== false)
      .filter((x) => cat === 'All' || x.category === cat)
      .filter((x) => !term || (x.name || '').toLowerCase().includes(term));
  }, [shops, q, cat]);

  const header = (
    <View>
      <View style={s.top}>
        <View>
          <Text style={s.hello}>{firstName(profile?.name) ? `Hello, ${firstName(profile.name)}` : 'Welcome'}</Text>
          <Text style={s.sub}>What can we deliver today?</Text>
        </View>
        <View style={s.badge}>
          <Ionicons name="bicycle" size={22} color={colors.onAccent} />
        </View>
      </View>

      <Field
        icon="search"
        placeholder="Search restaurants and shops"
        value={q}
        onChangeText={setQ}
        returnKeyType="search"
        style={{ marginTop: 16 }}
      />

      <View style={s.promo}>
        <View style={{ flex: 1 }}>
          <Text style={s.promoTitle}>Fast. Reliable. On time.</Text>
          <Text style={s.promoText}>Your order is picked up and delivered by moto, right to your door.</Text>
        </View>
        <Ionicons name="flash" size={44} color="rgba(26,18,4,0.25)" />
      </View>

      <SectionTitle title="Categories" style={{ marginTop: 22, marginBottom: 12 }} />
      <View style={s.grid}>
        {TILES.map((name) => {
          const cs = categoryStyle[name] || categoryStyle.Other;
          const on = cat === name;
          return (
            <TouchableOpacity key={name} style={s.tileWrap} onPress={() => setCat(name)} activeOpacity={0.85}>
              <View style={[s.tile, { backgroundColor: cs.color }, on && s.tileOn]}>
                <Ionicons name={cs.icon} size={26} color="#fff" />
              </View>
              <Text style={[s.tileText, on && { color: colors.orange }]} numberOfLines={1}>
                {name === 'Gas & Fuel' ? 'Gas & Fuel' : name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionTitle
        title={cat === 'All' ? 'Popular shops' : cat}
        action={cat !== 'All' || q ? 'Clear' : undefined}
        onAction={() => {
          setCat('All');
          setQ('');
        }}
        style={{ marginTop: 22, marginBottom: 12 }}
      />
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {shops === null && !error ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={error ? [] : visible}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}
          ListHeaderComponent={header}
          onRefresh={load}
          refreshing={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title="Could not load shops" text="Check your internet connection and try again.">
                <Button title="Try again" small variant="ghost" onPress={load} style={{ marginTop: 16 }} />
              </EmptyState>
            ) : (
              <EmptyState
                icon="storefront-outline"
                title="No shops here yet"
                text={q || cat !== 'All' ? 'Try another category or search.' : 'New shops will appear here soon.'}
              />
            )
          }
          renderItem={({ item }) => (
            <ShopCard shop={item} onPress={() => navigation.navigate('Shop', { shop: item })} />
          )}
        />
      )}

      {count > 0 && cartShop ? (
        <BottomBar
          label={`View cart · ${count} item${count > 1 ? 's' : ''}`}
          value={money(subtotal)}
          onPress={() => navigation.navigate('Shop', { shop: cartShop })}
        />
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { ...type.title, color: colors.text },
  sub: { color: colors.muted, marginTop: 2, fontSize: 15 },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 16,
  },
  promoTitle: { color: colors.onAccent, fontWeight: '800', fontSize: 18 },
  promoText: { color: 'rgba(26,18,4,0.8)', marginTop: 4, lineHeight: 19 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  tileWrap: { width: '25%', alignItems: 'center' },
  tile: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileOn: { borderColor: colors.orange },
  tileText: { color: colors.text, fontSize: 12, fontWeight: '600', marginTop: 7, textAlign: 'center' },

  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  logo: {
    width: '100%',
    height: 104,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#fff', fontSize: 40, fontWeight: '800' },
  shopName: { color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  metaText: { color: colors.muted, fontSize: 13, flexShrink: 1 },
});
