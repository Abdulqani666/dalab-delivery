import { registerRootComponent } from 'expo';
import React from 'react';
import { Text, View } from 'react-native';
function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#000' }}>Baseline works</Text>
      <Text style={{ color: '#000' }}>Build T0: bare app with no extra libraries.</Text>
    </View>
  );
}
registerRootComponent(App);
