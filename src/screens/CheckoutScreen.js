import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { Button, Field } from '../ui';
import { colors } from '../theme';
import { DEFAULT_REGION } from '../config';
import { deliveryFee, money } from '../utils';

export default function CheckoutScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { shop, list, subtotal, clear } = useCart();
  const [pin, setPin] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const mapRef = useRef(null);

  const shopLoc = shop?.location;

  // Start the pin at the phone location if allowed.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setPin(here);
        mapRef.current?.animateToRegion({ ...here, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
      } catch (e) {
        // ignore: customer can tap the map
      }
    })();
  }, []);

  const fee = useMemo(() => (pin ? deliveryFee(shopLoc, pin) : null), [pin, shopLoc]);
  const total = subtotal + (fee || 0);

  if (!shop || list.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>Your cart is empty.</Text>
      </View>
    );
  }

  const placeOrder = async () => {
    if (!pin) return Alert.alert('Delivery point', 'Tap the map to put the pin where we should deliver.');
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
      Alert.alert('Could not place the order', 'Check your internet and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={s.h}>From {shop.name}</Text>
      {list.map((i) => (
        <View key={i.id} style={s.line}>
          <Text style={s.t}>
            {i.qty} × {i.name}
          </Text>
          <Text style={s.t}>{money(i.qty * i.price)}</Text>
        </View>
      ))}

      <Text style={[s.h, { marginTop: 20 }]}>Where should we deliver?</Text>
      <Text style={s.muted}>Tap the map to move the pin.</Text>
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={shopLoc ? { ...shopLoc, latitudeDelta: 0.04, longitudeDelta: 0.04 } : DEFAULT_REGION}
        onPress={(e) => setPin(e.nativeEvent.coordinate)}
      >
        {shopLoc ? <Marker coordinate={shopLoc} title={shop.name} pinColor="orange" /> : null}
        {pin ? (
          <Marker coordinate={pin} title="Deliver here" draggable onDragEnd={(e) => setPin(e.nativeEvent.coordinate)} />
        ) : null}
      </MapView>

      <Field
        placeholder="Note for the rider (house colour, landmark…)"
        value={note}
        onChangeText={setNote}
        style={{ marginTop: 12 }}
      />

      <View style={s.totals}>
        <View style={s.line}>
          <Text style={s.t}>Items</Text>
          <Text style={s.t}>{money(subtotal)}</Text>
        </View>
        <View style={s.line}>
          <Text style={s.t}>Delivery</Text>
          <Text style={s.t}>{fee === null ? 'Set the pin' : money(fee)}</Text>
        </View>
        <View style={s.line}>
          <Text style={[s.t, { fontWeight: '800', fontSize: 18 }]}>Total</Text>
          <Text style={[s.t, { fontWeight: '800', fontSize: 18, color: colors.orange }]}>{money(total)}</Text>
        </View>
        <Text style={s.muted}>Payment: cash when the rider arrives.</Text>
      </View>

      <Button title="Place order" onPress={placeOrder} loading={busy} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  t: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, marginBottom: 8 },
  map: { height: 260, borderRadius: 16, overflow: 'hidden' },
  totals: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
});
