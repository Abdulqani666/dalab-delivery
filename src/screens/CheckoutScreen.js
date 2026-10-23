import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { Button, Card, Field, EmptyState } from '../ui';
import { colors, radius, type } from '../theme';
import { deliveryFee, haversineKm, money } from '../utils';

export default function CheckoutScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { shop, list, subtotal, clear } = useCart();
  const [pin, setPin] = useState(null);
  const [locState, setLocState] = useState('loading'); // loading | ok | denied | error
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const shopLoc = shop?.location;

  const locate = useCallback(async () => {
    setLocState('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocState('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setPin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setLocState('ok');
    } catch (e) {
      setLocState('error');
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const km = useMemo(() => (pin && shopLoc ? haversineKm(shopLoc, pin) : null), [pin, shopLoc]);
  const fee = useMemo(() => (pin ? deliveryFee(shopLoc, pin) : null), [pin, shopLoc]);
  const total = subtotal + (fee || 0);

  if (!shop || list.length === 0) {
    return (
      <View style={s.screen}>
        <EmptyState icon="bag-outline" title="Your cart is empty" text="Add something from a shop to place an order." />
      </View>
    );
  }

  const placeOrder = async () => {
    if (!pin) return Alert.alert('Delivery location', 'We need your location to deliver. Tap "Use my location".');
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: profile?.name || '',
          customer_phone: profile?.phone || '',
          shop_id: shop.id,
          shop_name: shop.name,
          shop_location: shopLoc || null,
          items: list.map((i) => ({ id: i.id, name: i.name, price: Number(i.price), qty: i.qty })),
          subtotal,
          delivery_fee: fee,
          total,
          payment: 'cash',
          dropoff: pin,
          note: note.trim(),
          status: 'new',
        })
        .select('id')
        .single();
      if (error) throw error;
      clear();
      navigation.reset({
        index: 1,
        routes: [{ name: 'Tabs' }, { name: 'OrderDetail', params: { orderId: data.id } }],
      });
    } catch (e) {
      Alert.alert('Could not place the order', 'Check your internet connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const locIcon = { loading: 'locate', ok: 'location', denied: 'location-outline', error: 'location-outline' }[locState];
  const locColor = locState === 'ok' ? colors.ok : locState === 'loading' ? colors.muted : colors.danger;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Order summary */}
        <Card>
          <Text style={s.label}>Order from</Text>
          <Text style={s.shop}>{shop.name}</Text>
          <View style={s.divider} />
          {list.map((i) => (
            <View key={i.id} style={s.line}>
              <Text style={s.qty}>{i.qty}×</Text>
              <Text style={[s.t, { flex: 1 }]} numberOfLines={1}>
                {i.name}
              </Text>
              <Text style={s.t}>{money(i.qty * i.price)}</Text>
            </View>
          ))}
        </Card>

        {/* Delivery location */}
        <Card>
          <Text style={s.label}>Deliver to</Text>
          <View style={s.locRow}>
            <View style={[s.locIcon, { backgroundColor: locState === 'ok' ? colors.okSoft : colors.surface2 }]}>
              {locState === 'loading' ? (
                <ActivityIndicator color={colors.orange} />
              ) : (
                <Ionicons name={locIcon} size={22} color={locColor} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.locTitle}>
                {locState === 'ok'
                  ? 'Your current location'
                  : locState === 'loading'
                  ? 'Finding your location…'
                  : 'Location needed'}
              </Text>
              <Text style={s.locSub}>
                {locState === 'ok' && km !== null
                  ? `About ${km.toFixed(1)} km from the shop`
                  : locState === 'denied'
                  ? 'Allow location so the rider can find you.'
                  : locState === 'error'
                  ? 'We could not get your location. Turn on GPS and try again.'
                  : 'Please wait a moment.'}
              </Text>
            </View>
          </View>
          {locState === 'denied' || locState === 'error' || locState === 'ok' ? (
            <Button
              title={locState === 'ok' ? 'Update my location' : 'Use my location'}
              icon="navigate"
              small
              variant="ghost"
              onPress={locate}
              style={{ marginTop: 12 }}
            />
          ) : null}
          <Field
            icon="create-outline"
            placeholder="Note for the rider (house colour, landmark…)"
            value={note}
            onChangeText={setNote}
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* Payment + totals */}
        <Card>
          <Text style={s.label}>Payment</Text>
          <View style={s.payRow}>
            <Ionicons name="cash-outline" size={22} color={colors.ok} />
            <Text style={[s.t, { marginLeft: 10, flex: 1 }]}>Cash when the rider arrives</Text>
          </View>
          <View style={s.divider} />
          <View style={s.line}>
            <Text style={[s.t, { flex: 1, color: colors.muted }]}>Items</Text>
            <Text style={s.t}>{money(subtotal)}</Text>
          </View>
          <View style={s.line}>
            <Text style={[s.t, { flex: 1, color: colors.muted }]}>Delivery</Text>
            <Text style={s.t}>{fee === null ? '—' : money(fee)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.line}>
            <Text style={[s.totalLabel, { flex: 1 }]}>Total</Text>
            <Text style={s.totalValue}>{money(total)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={s.footer}>
        <Button title={`Place order · ${money(total)}`} icon="checkmark-circle" onPress={placeOrder} loading={busy} disabled={!pin} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  label: { ...type.label, color: colors.muted },
  shop: { ...type.h1, color: colors.text, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  qty: { color: colors.orange, fontWeight: '800', width: 34, fontSize: 15 },
  t: { color: colors.text, fontSize: 15 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  locIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  locTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  locSub: { color: colors.muted, marginTop: 2, fontSize: 13, lineHeight: 18 },
  payRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  totalLabel: { color: colors.text, fontWeight: '800', fontSize: 18 },
  totalValue: { color: colors.orange, fontWeight: '800', fontSize: 20 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
