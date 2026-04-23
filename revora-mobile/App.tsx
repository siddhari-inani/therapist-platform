import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import type { WebViewOpenWindowEvent } from "react-native-webview/lib/WebViewTypes";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const DEFAULT_URL = "https://revora-health.vercel.app";

function resolveWebAppUrl(): string {
  const fromExtra = (
    Constants.expoConfig?.extra as { webAppUrl?: string } | undefined
  )?.webAppUrl;
  const fromEnv = process.env.EXPO_PUBLIC_WEB_APP_URL;
  const raw = (fromEnv || fromExtra || DEFAULT_URL).replace(/\/$/, "");
  if (!/^https?:\/\//i.test(raw)) return DEFAULT_URL;
  return raw;
}

export default function App() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const baseUrl = useMemo(() => resolveWebAppUrl(), []);
  const [activeUrl, setActiveUrl] = useState(baseUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const webRef = useRef<WebView>(null);

  const surface = isDark ? "#0f172a" : "#f8fafc";
  const border = isDark ? "#1e293b" : "#e2e8f0";
  const text = isDark ? "#f1f5f9" : "#0f172a";
  const muted = isDark ? "#94a3b8" : "#64748b";

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
    if (nav.url) setActiveUrl(nav.url);
  }, []);

  const onLoadStart = useCallback(() => {
    setLoadError(null);
    setLoading(true);
  }, []);

  const onLoadEnd = useCallback(() => {
    setLoading(false);
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  const onError = useCallback(() => {
    setLoading(false);
    setLoadError("Could not load Revora. Check your connection and try again.");
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  const onShouldStart = useCallback((req: { url: string; navigationType?: string }) => {
    const { url } = req;
    if (/^tel:/i.test(url) || /^mailto:/i.test(url)) {
      void Linking.openURL(url);
      return false;
    }
    return true;
  }, []);

  const onOpenWindow = useCallback((e: WebViewOpenWindowEvent) => {
    const u = e.nativeEvent.targetUrl;
    if (u) setActiveUrl(u);
  }, []);

  const goBack = useCallback(() => {
    webRef.current?.goBack();
  }, []);

  const reload = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    if (webRef.current) {
      webRef.current.reload();
    }
  }, []);

  const appUa =
    Platform.OS === "ios"
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 RevoraApp/1.0"
      : "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 RevoraApp/1.0";

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: surface }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <View
        style={[
          styles.toolbar,
          {
            borderBottomColor: border,
            backgroundColor: surface,
          },
        ]}
      >
        <View style={styles.toolLeft}>
          {canGoBack ? (
            <Pressable
              onPress={goBack}
              accessibilityLabel="Back"
              hitSlop={12}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={[styles.backLabel, { color: text }]}>‹ Back</Text>
            </Pressable>
          ) : (
            <View style={styles.toolPlaceholder} />
          )}
        </View>
        <Text style={[styles.title, { color: text }]} numberOfLines={1}>
          Revora Health
        </Text>
        <View style={styles.toolRight}>
          <Pressable
            onPress={reload}
            accessibilityLabel="Refresh"
            hitSlop={12}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text style={[styles.action, { color: text }]}>↻</Text>
          </Pressable>
        </View>
      </View>

      {loadError ? (
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: text }]}>{loadError}</Text>
          <Text style={[styles.hint, { color: muted }]}>
            Web app: {baseUrl}
          </Text>
          <Pressable
            onPress={reload}
            style={({ pressed }) => [
              styles.retryBtn,
              { borderColor: border, backgroundColor: isDark ? "#1e293b" : "#fff" },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={{ color: text, fontWeight: "600" }}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.webWrap}>
          {loading ? (
            <View style={[styles.spinner, { backgroundColor: surface }]}>
              <ActivityIndicator
                size="large"
                color={isDark ? "#38bdf8" : "#0ea5e9"}
              />
              <Text style={[styles.hint, { color: muted, marginTop: 12 }]}>
                Loading…
              </Text>
            </View>
          ) : null}
          <WebView
            ref={webRef}
            source={{ uri: activeUrl }}
            onNavigationStateChange={onNavChange}
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
            onError={onError}
            onShouldStartLoadWithRequest={onShouldStart}
            onOpenWindow={onOpenWindow}
            setSupportMultipleWindows={true}
            style={styles.webview}
            userAgent={appUa}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            allowFileAccess
            allowUniversalAccessFromFileURLs={false}
            mixedContentMode="compatibility"
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures
            pullToRefreshEnabled
            setBuiltInZoomControls={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolLeft: { minWidth: 72, alignItems: "flex-start" },
  toolRight: { minWidth: 72, alignItems: "flex-end" },
  toolPlaceholder: { minWidth: 72 },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "600" },
  backLabel: { fontSize: 17, fontWeight: "500" },
  action: { fontSize: 22, fontWeight: "400", paddingHorizontal: 4 },
  pressed: { opacity: 0.6 },
  webWrap: { flex: 1, position: "relative" },
  webview: { flex: 1, backgroundColor: "transparent" },
  spinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  errorWrap: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 8,
  },
  hint: { fontSize: 13, textAlign: "center", marginBottom: 16 },
  retryBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
