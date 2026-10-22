import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { colors } from '../theme';
import { useCart } from '../CartContext';
import { money } from '../utils';

export default function ShopScreen({ route, navigation }) {
  const { shop } = route.params;
  const [products, setProducts] = useState(null);
  const { items, add, remove, count, subtotal, shop: cartShop } = useCart();

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
      else
        setProducts(
          data.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), imageUrl: p.image_url }))
        );
    })();
    return () => {
      active = false;
    };
  }, [shop.id]);

  const cartIsHere = cartShop && cartShop.id === shop.id;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {products === null ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}
          ListEmptyComponent={<Text style={s.empty}>No products yet.</Text>}
          renderItem={({ item }) => {
            const qty = cartIsHere ? items[item.id]?.qty || 0 : 0;
            return (
              <View style={s.row}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={s.img} />
                ) : (
                  <View style={[s.img, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="fast-food" size={28} color={colors.muted} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.price}>{money(item.price)}</Text>
                </View>
                {qty > 0 ? (
                  <View style={s.stepper}>
                    <TouchableOpacity onPress={() => remove(item.id)} style={s.stepBtn}>
                      <Ionicons name="remove" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.qty}>{qty}</Text>
                    <TouchableOpacity onPress={() => add(shop, item)} style={s.stepBtn}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => add(shop, item)} style={s.addBtn}>
                    <Ionicons name="add" size={22} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {cartIsHere && count > 0 ? (
        <TouchableOpacity style={s.cartBar} onPress={() => navigation.navigate('Checkout')} activeOpacity={0.9}>
          <Text style={s.cartText}>
            Checkout · {count} item{count > 1 ? 's' : ''}
          </Text>
          <Text style={s.cartText}>{money(subtotal)}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  img: { width: 64, height: 64, borderRadius: 10, backgroundColor: colors.border },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  price: { color: colors.orange, marginTop: 4, fontWeight: '700' },
  addBtn: { backgroundColor: colors.teal, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { backgroundColor: colors.teal, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qty: { color: colors.text, fontWeight: '700', marginHorizontal: 10, fontSize: 16 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
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
