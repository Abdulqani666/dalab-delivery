import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';
import { useLive } from '../useLive';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';
import { money, STATUS } from '../utils';

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, shop_name, total, status, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    setOrders(error ? [] : data);
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  useLive('my-orders', 'orders', `customer_id=eq.${user.id}`, load);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Text style={s.title}>My orders</Text>
      {orders === null ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<Text style={s.empty}>No orders yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.shop}>{item.shop_name}</Text>
                <Text style={s.total}>{money(item.total)}</Text>
              </View>
              <Text
                style={[
                  s.status,
                  item.status === 'delivered' && { color: colors.ok },
                  item.status === 'cancelled' && { color: colors.danger },
                ]}
              >
                {STATUS[item.status]?.label || item.status}
              </Text>
              <Text style={s.muted}>{new Date(item.created_at).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800', paddingHorizontal: 16, paddingTop: 8 },
  card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  shop: { color: colors.text, fontWeight: '700', fontSize: 16 },
  total: { color: colors.orange, fontWeight: '700' },
  status: { color: colors.teal, marginTop: 6, fontWeight: '600' },
  muted: { color: colors.muted, marginTop: 4, fontSize: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
});
