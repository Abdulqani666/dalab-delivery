import React from 'react';
import { View, Text } from 'react-native';

// Maps are switched off in this build.
export const MapView = React.forwardRef((props, _ref) => (
  <View style={[{ backgroundColor: '#24403d', alignItems: 'center', justifyContent: 'center', padding: 16 }, props.style]}>
    <Text style={{ color: '#fff', textAlign: 'center' }}>Map is switched off in this test build</Text>
  </View>
));
export const Marker = () => null;
