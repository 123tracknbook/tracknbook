import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Web stub — paywall is native-only. This file prevents Metro from attempting
// to bundle react-native-purchases-ui (which has no web support) when targeting web.
export default function PaywallScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Upgrade to Pro</Text>
      <Text style={styles.sub}>Subscriptions are available in the mobile app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1f2e",
    padding: 24,
  },
  text: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});
