import React from 'react';
import { View, Text } from 'react-native';

// Loads the map library safely. If it cannot load, the screen still works and shows a message.
let Maps = null;
let loadError = null;
try {
  Maps = require('react-native-maps');
} catch (e) {
  loadError = e;
}

function Fallback({ style }) {
  return (
    <View style={[{ backgroundColor: '#24403d', alignItems: 'center', justifyContent: 'center', padding: 16 }, style]}>
      <Text style={{ color: '#fff', textAlign: 'center' }}>
        Map not available: {String((loadError && loadError.message) || 'unknown')}
      </Text>
    </View>
  );
}

export const MapView = Maps ? Maps.default : React.forwardRef((props, _ref) => <Fallback style={props.style} />);
export const Marker = Maps ? Maps.Marker : () => null;
