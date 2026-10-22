import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { useLive } from '../useLive';
import { useAuth } from '../AuthContext';
import { Button } from '../ui';
import { colors } from '../theme';
import { money, STATUS } from '../utils';

export default function RiderScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const watchRef = useRef(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['new', 'accepted', 'picked_up'])
      .order('created_at', { ascending: true });
    if (error) {
      setOrders([]);
      return;
    }
    // New orders are for every rider; accepted ones only for the rider who took them.
    setOrders(data.filter((o) => o.status === 'new' || o.rider_id === user.id));
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  useLive('rider-orders', 'orders', null, load);

  // While I have an active order, send my location so the customer sees the moto on the map.
  const activeIds = (orders || []).filter((o) => o.rider_id === user.id).map((o) => o.id);
  const activeKey = activeIds.join(',');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      if (activeIds.length === 0) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 15 },
        (pos) => {
          const rider_location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          activeIds.forEach((id) => {
            supabase.from('orders').update({ rider_location }).eq('id', id).then(() => {});
          });
        }
      );
      if (cancelled) sub.remove();
      else watchRef.current = sub;
    })();
    return () => {
      cancelled = true;
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const setStatus = async (order, patch) => {
    const { error } = await supabase.from('orders').update(patch).eq('id', order.id);
    if (error) Alert.alert('Could not update', 'Check your internet and try again.');
    load();
  };

  const accept = async (o) => {
    const { data, error } = await supabase.rpc('accept_order', { p_order: o.id });
    if (error) Alert.alert('Could not accept', 'Check your internet and try again.');
    else if (!data) Alert.alert('Too late', 'This order was cancelled or taken by another rider.');
    load();
  };

  const navigate = (loc) => {
    if (!loc) return;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Text style={s.title}>Deliveries</Text>
      {orders === null ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onRefresh={load}
          refreshing={false}
          ListEmptyComponent={<Text style={s.empty}>No orders right now.</Text>}
          renderItem={({ item: o }) => (
            <View style={s.card}>
              <View style={s.rowBetween}>
                <Text style={s.shop}>{o.shop_name}</Text>
                <Text style={s.badge}>{STATUS[o.status]?.label}</Text>
              </View>
              <Text style={s.t}>{o.items?.map((i) => `${i.qty}× ${i.name}`).join(', ')}</Text>
              <Text style={s.muted}>
                Customer: {o.customer_name} · {o.customer_phone}
              </Text>
              {o.note ? <Text style={s.muted}>Note: {o.note}</Text> : null}
              <Text style={[s.t, { marginTop: 6, fontWeight: '700' }]}>
                Collect {money(o.total)} cash (items {money(o.subtotal)} + delivery {money(o.delivery_fee)})
              </Text>

              <View style={s.actions}>
                {o.status === 'new' && <Button title="Accept order" onPress={() => accept(o)} style={{ flex: 1 }} />}

                {o.status === 'accepted' && (
                  <>
                    <Button title="Go to shop" color={colors.teal} onPress={() => navigate(o.shop_location)} style={{ flex: 1 }} />
                    <Button title="Picked up" onPress={() => setStatus(o, { status: 'picked_up' })} style={{ flex: 1 }} />
                  </>
                )}

                {o.status === 'picked_up' && (
                  <>
                    <Button title="Go to customer" color={colors.teal} onPress={() => navigate(o.dropoff)} style={{ flex: 1 }} />
                    <Button
                      title="Delivered"
                      color={colors.ok}
                      onPress={() =>
                        Alert.alert('Delivered?', `Did you collect ${money(o.total)} cash?`, [
                          { text: 'Not yet', style: 'cancel' },
                          { text: 'Yes', onPress: () => setStatus(o, { status: 'delivered' }) },
                        ])
                      }
                      style={{ flex: 1 }}
                    />
                  </>
                )}
              </View>

              {o.status !== 'new' && o.customer_phone ? (
                <Button
                  title="Call customer"
                  color={colors.border}
                  onPress={() => Linking.openURL(`tel:${o.customer_phone}`)}
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800', paddingHorizontal: 16, paddingTop: 8 },
  card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  shop: { color: colors.text, fontWeight: '800', fontSize: 17, flexShrink: 1 },
  badge: { color: colors.orange, fontWeight: '700', fontSize: 12, marginLeft: 8 },
  t: { color: colors.text, fontSize: 14 },
  muted: { color: colors.muted, marginTop: 4, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
});
