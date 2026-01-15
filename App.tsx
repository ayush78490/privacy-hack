import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Clipboard from '@react-native-clipboard/clipboard';

function App(): React.JSX.Element {
  // 10.0.2.2 is the host loopback for Android emulators
  // Set to true to use the dev server, false to use bundled assets
  const isDev = true;
  const uri = isDev ? 'http://10.0.2.2:5173' : 'file:///android_asset/www/index.html';

  const [error, setError] = React.useState<string | null>(null);
  const webViewRef = React.useRef<WebView>(null);

  const reload = () => {
    setError(null);
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#050505"
      />
      <View style={styles.content}>
        <WebView
          ref={webViewRef}
          source={{ uri }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          originWhitelist={['*']}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setError(`Error: ${nativeEvent.description} (${nativeEvent.code})`);
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'COPY_TO_CLIPBOARD') {
                Clipboard.setString(data.payload);
                console.log('Copied to native clipboard:', data.payload);
              }
            } catch (err) {
              console.warn('Failed to parse WebView message:', event.nativeEvent.data);
            }
          }}
          renderError={(errorName, errorCode, errorDesc) => (
            <View style={styles.errorContainer}>
              <View style={styles.errorBox}>
                <View style={styles.statusBar} />
                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>Connection Error</Text>
                  <Text style={styles.errorDescription}>{errorDesc}</Text>
                  <Text style={styles.errorCode}>Code: {errorCode}</Text>
                  <Text style={styles.apiUrl}>URL: {uri}</Text>
                  <TouchableOpacity onPress={reload} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry Connection</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

import { Text, TouchableOpacity } from 'react-native';

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
  errorContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  statusBar: {
    height: 4,
    backgroundColor: '#ff4444',
  },
  errorContent: {
    padding: 24,
    alignItems: 'center',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDescription: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorCode: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  apiUrl: {
    color: '#444',
    fontSize: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default App;
