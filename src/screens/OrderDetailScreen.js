import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useLive } from '../useLive';
import { colors, radius, type } from '../theme';
import { Button, Card, EmptyState, Avatar } from '../ui';
import { money, STATUS, formatDate } from '../utils';

const STEPS = [
  { label: 'Order placed', icon: 'receipt' },
  { label: 'Rider accepted', icon: 'person' },
  { label: 'On the way', icon: 'bicycle' },
  { label: 'Delivered', icon: 'checkmark' },
];

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

  if (order === null) return <ActivityIndicator color={colors.orange} style={{ marginTop: 60 }} />;
  if (order === false)
    return (
      <View style={s.screen}>
        <EmptyState icon="alert-circle-outline" title="Order not found" />
      </View>
    );

  const st = STATUS[order.status] || STATUS.new;
  const step = st.step;
  const cancelled = order.status === 'cancelled';

  const cancel = () =>
    Alert.alert('Cancel this order?', 'You can only cancel before a rider accepts it.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          const { data, error } = await supabase.rpc('cancel_order', { p_order: order.id });
          if (error || !data) Alert.alert('Could not cancel', 'A rider may have just accepted your order.');
          load();
        },
      },
    ]);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
      {/* Status */}
      <View style={[s.hero, { backgroundColor: st.bg }]}>
        <View style={[s.heroIcon, { backgroundColor: st.color }]}>
          <Ionicons name={st.icon} size={30} color={colors.bg} />
        </View>
        <Text style={[s.heroTitle, { color: st.color }]}>{st.label}</Text>
        <Text style={s.heroSub}>
          {order.shop_name} · {formatDate(order.created_at)}
        </Text>
      </View>

      {/* Timeline */}
      {!cancelled && (
        <Card>
          {STEPS.map((x, i) => {
            const done = i <= step;
            const last = i === STEPS.length - 1;
            return (
              <View key={x.label} style={s.stepRow}>
                <View style={s.stepLeft}>
                  <View style={[s.dot, done && { backgroundColor: colors.orange, borderColor: colors.orange }]}>
                    <Ionicons name={done ? 'checkmark' : x.icon} size={14} color={done ? colors.onAccent : colors.muted} />
                  </View>
                  {!last && <View style={[s.line, i < step && { backgroundColor: colors.orange }]} />}
                </View>
                <Text style={[s.stepText, done && { color: colors.text, fontWeight: '700' }]}>{x.label}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* Rider */}
      {order.rider_name && !cancelled ? (
        <Card>
          <Text style={s.label}>Your rider</Text>
          <View style={s.riderRow}>
            <Avatar name={order.rider_name} size={48} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.riderName}>{order.rider_name}</Text>
              <Text style={s.riderSub}>Moto rider</Text>
            </View>
            {order.rider_phone && order.status !== 'delivered' ? (
              <Button title="Call" icon="call" small onPress={() => Linking.openURL(`tel:${order.rider_phone}`)} />
            ) : null}
          </View>
        </Card>
      ) : null}

      {/* Receipt */}
      <Card>
        <Text style={s.label}>Order summary</Text>
        <View style={{ marginTop: 10 }}>
          {order.items?.map((i) => (
            <View key={i.id} style={s.rowLine}>
              <Text style={s.qty}>{i.qty}×</Text>
              <Text style={[s.t, { flex: 1 }]} numberOfLines={1}>
                {i.name}
              </Text>
              <Text style={s.t}>{money(i.qty * i.price)}</Text>
            </View>
          ))}
        </View>
        <View style={s.divider} />
        <View style={s.rowLine}>
          <Text style={[s.t, { flex: 1, color: colors.muted }]}>Delivery</Text>
          <Text style={s.t}>{money(order.delivery_fee)}</Text>
        </View>
        <View style={s.rowLine}>
          <Text style={[s.total, { flex: 1 }]}>Total (cash)</Text>
          <Text style={[s.total, { color: colors.orange }]}>{money(order.total)}</Text>
        </View>
        {order.note ? (
          <View style={s.noteBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.muted} />
            <Text style={s.note}>{order.note}</Text>
          </View>
        ) : null}
      </Card>

      {order.status === 'new' ? <Button title="Cancel order" variant="danger" icon="close" onPress={cancel} /> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { borderRadius: radius.xl, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { ...type.h1, marginTop: 14, textAlign: 'center' },
  heroSub: { color: colors.muted, marginTop: 4, textAlign: 'center' },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 44 },
  stepLeft: { alignItems: 'center', width: 30 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2, minHeight: 14 },
  stepText: { color: colors.muted, fontSize: 15, marginLeft: 12, paddingTop: 4 },

  label: { ...type.label, color: colors.muted },
  riderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  riderName: { color: colors.text, fontWeight: '700', fontSize: 16 },
  riderSub: { color: colors.muted, marginTop: 2, fontSize: 13 },

  rowLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  qty: { color: colors.orange, fontWeight: '800', width: 34, fontSize: 15 },
  t: { color: colors.text, fontSize: 15 },
  total: { color: colors.text, fontWeight: '800', fontSize: 17 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    padding: 10,
  },
  note: { color: colors.muted, flex: 1, fontSize: 14 },
});
