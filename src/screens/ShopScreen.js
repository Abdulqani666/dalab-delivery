import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useCart } from '../CartContext';
import { colors, radius, type, categoryStyle } from '../theme';
import { BottomBar, EmptyState, Pill } from '../ui';
import { money } from '../utils';

export default function ShopScreen({ route, navigation }) {
  const { shop } = route.params;
  const [products, setProducts] = useState(null);
  const { items, add, remove, count, subtotal, shop: cartShop } = useCart();
  const cs = categoryStyle[shop.category] || categoryStyle.Other;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('available', true)
        .order('name');
      if (!active) return;
      if (error) setProducts([]);
      else setProducts(data.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), imageUrl: p.image_url })));
    })();
    return () => {
      active = false;
    };
  }, [shop.id]);

  const cartIsHere = cartShop && cartShop.id === shop.id;

  const header = (
    <View style={s.head}>
      {shop.logoUrl ? (
        <Image source={{ uri: shop.logoUrl }} style={s.logo} />
      ) : (
        <View style={[s.logo, { backgroundColor: cs.color }]}>
          <Text style={s.logoLetter}>{(shop.name || '?').trim()[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.name}>{shop.name}</Text>
        <View style={s.metaRow}>
          <Ionicons name={cs.icon} size={14} color={colors.muted} />
          <Text style={s.meta}>{shop.category}</Text>
        </View>
        <Pill label="Open now" color={colors.ok} bg={colors.okSoft} style={{ marginTop: 8 }} />
      </View>
    </View>
  );

  return (
    <View style={s.screen}>
      {products === null ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {header}
              <Text style={s.menu}>Menu</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<EmptyState icon="pricetags-outline" title="No products yet" text="This shop has not added products." />}
          renderItem={({ item }) => {
            const qty = cartIsHere ? items[item.id]?.qty || 0 : 0;
            return (
              <View style={[s.row, qty > 0 && s.rowOn]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={s.img} />
                ) : (
                  <View style={[s.img, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="fast-food-outline" size={26} color={colors.muted} />
                  </View>
                )}
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={s.pname} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={s.price}>{money(item.price)}</Text>
                </View>
                {qty > 0 ? (
                  <View style={s.stepper}>
                    <TouchableOpacity onPress={() => remove(item.id)} style={s.stepBtn} hitSlop={6}>
                      <Ionicons name={qty === 1 ? 'trash-outline' : 'remove'} size={18} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={s.qty}>{qty}</Text>
                    <TouchableOpacity onPress={() => add(shop, item)} style={[s.stepBtn, s.stepAdd]} hitSlop={6}>
                      <Ionicons name="add" size={18} color={colors.onAccent} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => add(shop, item)} style={s.addBtn} hitSlop={6}>
                    <Ionicons name="add" size={22} color={colors.onAccent} />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {cartIsHere && count > 0 ? (
        <BottomBar
          label={`Checkout · ${count} item${count > 1 ? 's' : ''}`}
          value={money(subtotal)}
          onPress={() => navigation.navigate('Checkout')}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { ...type.h1, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  meta: { color: colors.muted, fontSize: 14 },
  menu: { ...type.h2, color: colors.text, marginTop: 22, marginBottom: 12 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  rowOn: { borderColor: colors.orange },
  img: { width: 66, height: 66, borderRadius: radius.md, backgroundColor: colors.surface2 },
  pname: { color: colors.text, fontWeight: '700', fontSize: 16 },
  price: { color: colors.orange, marginTop: 4, fontWeight: '800', fontSize: 15 },
  addBtn: {
    backgroundColor: colors.orange,
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    backgroundColor: colors.surface2,
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepAdd: { backgroundColor: colors.orange },
  qty: { color: colors.text, fontWeight: '800', marginHorizontal: 12, fontSize: 16, minWidth: 14, textAlign: 'center' },
});
