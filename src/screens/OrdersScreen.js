import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useLive } from '../useLive';
import { useAuth } from '../AuthContext';
import { colors, radius, type } from '../theme';
import { EmptyState, Pill } from '../ui';
import { money, STATUS, formatDate } from '../utils';

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, shop_name, total, status, created_at, items')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    setOrders(error ? [] : data);
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  useLive('my-orders', 'orders', `customer_id=eq.${user.id}`, load);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.title}>My orders</Text>
      {orders === null ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingTop: 12, gap: 12 }}
          onRefresh={load}
          refreshing={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No orders yet" text="When you place an order it will appear here." />
          }
          renderItem={({ item }) => {
            const st = STATUS[item.status] || STATUS.new;
            const summary = (item.items || []).map((i) => `${i.qty}× ${i.name}`).join(', ');
            return (
              <TouchableOpacity
                style={s.card}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <View style={s.rowTop}>
                  <View style={[s.iconBox, { backgroundColor: st.bg }]}>
                    <Ionicons name={st.icon} size={22} color={st.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.shop} numberOfLines={1}>
                      {item.shop_name}
                    </Text>
                    <Text style={s.date}>{formatDate(item.created_at)}</Text>
                  </View>
                  <Text style={s.total}>{money(item.total)}</Text>
                </View>
                {summary ? (
                  <Text style={s.summary} numberOfLines={1}>
                    {summary}
                  </Text>
                ) : null}
                <View style={s.rowBottom}>
                  <Pill label={st.label} color={st.color} bg={st.bg} />
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { ...type.title, color: colors.text, paddingHorizontal: 16, paddingTop: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  shop: { color: colors.text, fontWeight: '700', fontSize: 16 },
  date: { color: colors.muted, fontSize: 13, marginTop: 2 },
  total: { color: colors.orange, fontWeight: '800', fontSize: 16 },
  summary: { color: colors.muted, marginTop: 10, fontSize: 14 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
});
