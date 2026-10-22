import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../supabase';
import { useLive } from '../useLive';
import { colors } from '../theme';
import { Button } from '../ui';
import { money, STATUS } from '../utils';

const STEPS = ['Order placed', 'Rider accepted', 'On the way', 'Delivered'];

export default function OrderDetailScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null); // null = loading, false = not found

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    setOrder(error || !data ? false : data);
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  useLive('order-detail', 'orders', `id=eq.${orderId}`, load);

  if (order === null) return <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />;
  if (order === false)
    return <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Order not found.</Text>;

  const step = STATUS[order.status]?.step ?? 0;
  const cancelled = order.status === 'cancelled';

  const cancel = () =>
    Alert.alert('Cancel order?', 'You can only cancel before a rider accepts.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          const { data, error } = await supabase.rpc('cancel_order', { p_order: order.id });
          if (error || !data) Alert.alert('Could not cancel', 'A rider may have just accepted your order.');
          load();
        },
      },
    ]);

  const region = order.dropoff ? { ...order.dropoff, latitudeDelta: 0.03, longitudeDelta: 0.03 } : undefined;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={s.shop}>{order.shop_name}</Text>
      <Text style={[s.status, cancelled && { color: colors.danger }]}>{STATUS[order.status]?.label}</Text>

      {!cancelled && (
        <View style={s.steps}>
          {STEPS.map((label, i) => (
            <View key={label} style={s.stepRow}>
              <View style={[s.dot, i <= step && { backgroundColor: colors.orange, borderColor: colors.orange }]} />
              <Text style={[s.stepText, i <= step && { color: colors.text }]}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {region ? (
        <MapView style={s.map} initialRegion={region}>
          {order.shop_location ? <Marker coordinate={order.shop_location} title={order.shop_name} pinColor="orange" /> : null}
          <Marker coordinate={order.dropoff} title="Delivery point" pinColor="green" />
          {order.rider_location ? <Marker coordinate={order.rider_location} title="Rider" pinColor="blue" /> : null}
        </MapView>
      ) : null}

      <View style={s.box}>
        {order.items?.map((i) => (
          <View key={i.id} style={s.line}>
            <Text style={s.t}>
              {i.qty} × {i.name}
            </Text>
            <Text style={s.t}>{money(i.qty * i.price)}</Text>
          </View>
        ))}
        <View style={s.line}>
          <Text style={s.t}>Delivery</Text>
          <Text style={s.t}>{money(order.delivery_fee)}</Text>
        </View>
        <View style={s.line}>
          <Text style={[s.t, { fontWeight: '800' }]}>Total (cash)</Text>
          <Text style={[s.t, { fontWeight: '800', color: colors.orange }]}>{money(order.total)}</Text>
        </View>
      </View>

      {order.rider_phone && order.status !== 'delivered' && !cancelled ? (
        <Button
          title={`Call rider${order.rider_name ? ` (${order.rider_name})` : ''}`}
          color={colors.teal}
          onPress={() => Linking.openURL(`tel:${order.rider_phone}`)}
          style={{ marginTop: 14 }}
        />
      ) : null}
      {order.status === 'new' ? (
        <Button title="Cancel order" color={colors.danger} onPress={cancel} style={{ marginTop: 14 }} />
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  shop: { color: colors.text, fontSize: 22, fontWeight: '800' },
  status: { color: colors.teal, fontSize: 16, fontWeight: '700', marginTop: 4 },
  steps: { marginTop: 14, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.border, marginRight: 12 },
  stepText: { color: colors.muted, fontSize: 15 },
  map: { height: 240, borderRadius: 16, overflow: 'hidden', marginTop: 14 },
  box: { marginTop: 14, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  t: { color: colors.text, fontSize: 15 },
});
