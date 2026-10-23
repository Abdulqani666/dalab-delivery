import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { useLive } from '../useLive';
import { useAuth } from '../AuthContext';
import { Button, Card, EmptyState, Pill } from '../ui';
import { colors, radius, type } from '../theme';
import { money, STATUS, formatDate } from '../utils';

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

  // While I have an active order, send my location so the customer can follow the moto.
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
    if (error) Alert.alert('Could not update', 'Check your internet connection and try again.');
    load();
  };

  const accept = async (o) => {
    const { data, error } = await supabase.rpc('accept_order', { p_order: o.id });
    if (error) Alert.alert('Could not accept', 'Check your internet connection and try again.');
    else if (!data) Alert.alert('Too late', 'This order was cancelled or taken by another rider.');
    load();
  };

  const navigate = (loc) => {
    if (!loc) return;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`);
  };

  const available = (orders || []).filter((o) => o.status === 'new').length;
  const mine = (orders || []).filter((o) => o.rider_id === user.id).length;

  const header = (
    <View style={{ gap: 14, marginBottom: 4 }}>
      <Text style={s.title}>Deliveries</Text>
      <View style={s.stats}>
        <View style={[s.stat, { backgroundColor: colors.orangeSoft }]}>
          <Text style={[s.statNum, { color: colors.orange }]}>{available}</Text>
          <Text style={s.statLabel}>New orders</Text>
        </View>
        <View style={[s.stat, { backgroundColor: colors.tealSoft }]}>
          <Text style={[s.statNum, { color: colors.teal }]}>{mine}</Text>
          <Text style={s.statLabel}>My active</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {orders === null ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onRefresh={load}
          refreshing={false}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState icon="bicycle-outline" title="No orders right now" text="New orders appear here automatically." />
          }
          renderItem={({ item: o }) => {
            const st = STATUS[o.status] || STATUS.new;
            return (
              <Card>
                <View style={s.rowBetween}>
                  <Text style={s.shop} numberOfLines={1}>
                    {o.shop_name}
                  </Text>
                  <Pill label={st.short} color={st.color} bg={st.bg} icon={st.icon} />
                </View>
                <Text style={s.date}>{formatDate(o.created_at)}</Text>

                <View style={s.items}>
                  {o.items?.map((i) => (
                    <Text key={i.id} style={s.item}>
                      {i.qty}× {i.name}
                    </Text>
                  ))}
                </View>

                <View style={s.person}>
                  <Ionicons name="person-circle-outline" size={20} color={colors.muted} />
                  <Text style={s.personText} numberOfLines={1}>
                    {o.customer_name} · {o.customer_phone}
                  </Text>
                </View>
                {o.note ? (
                  <View style={s.person}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.muted} />
                    <Text style={s.personText}>{o.note}</Text>
                  </View>
                ) : null}

                <View style={s.cash}>
                  <Text style={s.cashLabel}>Collect cash</Text>
                  <Text style={s.cashValue}>{money(o.total)}</Text>
                </View>
                <Text style={s.breakdown}>
                  Items {money(o.subtotal)} + delivery {money(o.delivery_fee)}
                </Text>

                <View style={s.actions}>
                  {o.status === 'new' && <Button title="Accept order" icon="checkmark" onPress={() => accept(o)} style={{ flex: 1 }} />}

                  {o.status === 'accepted' && (
                    <>
                      <Button title="Go to shop" icon="navigate" variant="ghost" onPress={() => navigate(o.shop_location)} style={{ flex: 1 }} />
                      <Button title="Picked up" icon="bag-check" onPress={() => setStatus(o, { status: 'picked_up' })} style={{ flex: 1 }} />
                    </>
                  )}

                  {o.status === 'picked_up' && (
                    <>
                      <Button title="Go to customer" icon="navigate" variant="ghost" onPress={() => navigate(o.dropoff)} style={{ flex: 1 }} />
                      <Button
                        title="Delivered"
                        icon="checkmark-done"
                        variant="success"
                        onPress={() =>
                          Alert.alert('Delivered?', `Did you collect ${money(o.total)} in cash?`, [
                            { text: 'Not yet', style: 'cancel' },
                            { text: 'Yes, delivered', onPress: () => setStatus(o, { status: 'delivered' }) },
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
                    icon="call"
                    small
                    variant="secondary"
                    onPress={() => Linking.openURL(`tel:${o.customer_phone}`)}
                    style={{ marginTop: 10 }}
                  />
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { ...type.title, color: colors.text },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: radius.lg, padding: 14 },
  statNum: { fontSize: 28, fontWeight: '800' },
  statLabel: { color: colors.muted, marginTop: 2, fontSize: 13 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  shop: { color: colors.text, fontWeight: '800', fontSize: 17, flexShrink: 1 },
  date: { color: colors.muted, fontSize: 13, marginTop: 2 },
  items: { marginTop: 12, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 10, gap: 3 },
  item: { color: colors.text, fontSize: 14 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  personText: { color: colors.muted, fontSize: 14, flex: 1 },
  cash: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cashLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
  cashValue: { color: colors.orange, fontWeight: '800', fontSize: 22 },
  breakdown: { color: colors.muted, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
