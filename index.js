import { registerRootComponent } from 'expo';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

// If the app fails to start, show the error on screen instead of closing silently.
function ErrorScreen({ error }) {
  const text = String((error && (error.stack || error.message)) || error);
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Dalab Delivery could not start</Text>
      <Text style={{ marginVertical: 8, color: '#000' }}>Please send a screenshot of this screen.</Text>
      <ScrollView>
        <Text selectable style={{ fontSize: 12, color: '#b00020' }}>{text}</Text>
      </ScrollView>
    </View>
  );
}

class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) return <ErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}

let Root;
try {
  const App = require('./App').default;
  Root = function RootWrapper() {
    return (
      <Boundary>
        <App />
      </Boundary>
    );
  };
} catch (e) {
  Root = function RootError() {
    return <ErrorScreen error={e} />;
  };
}

registerRootComponent(Root);
