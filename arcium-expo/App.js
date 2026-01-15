import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Use http://10.0.2.2:5173 for Android emulator to access host's localhost
  // Use your computer's local IP for physical devices on the same WiFi
  const uri = Platform.OS === 'android' ? 'http://10.0.2.2:5173' : 'http://localhost:5173';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#050505"
      />
      <View style={styles.content}>
        <WebView
          source={{ uri }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#050505',
  },
});
