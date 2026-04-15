import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Purchases, { PurchasesOffering } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export default function PaywallScreen() {
  const router = useRouter();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paywallPresented, setPaywallPresented] = useState(false);

  console.log("[PaywallScreen] rendering — platform:", Platform.OS);

  const handleClose = () => {
    console.log("[PaywallScreen] Close button pressed");
    router.back();
  };

  useEffect(() => {
    console.log("[PaywallScreen] mounted — fetching current offering");
    Purchases.getCurrentOffering()
      .then((off) => {
        console.log(
          "[PaywallScreen] getCurrentOffering result:",
          off ? off.identifier : "null"
        );
        setOffering(off);
      })
      .catch((e) => {
        console.error("[PaywallScreen] getCurrentOffering error:", e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Once we have the offering, present the native paywall
  useEffect(() => {
    if (isLoading || paywallPresented) return;

    console.log(
      "[PaywallScreen] presenting native paywall — offering:",
      offering ? offering.identifier : "default"
    );
    setPaywallPresented(true);

    RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: "solo",
    })
      .then((result) => {
        console.log("[PaywallScreen] presentPaywallIfNeeded result:", result);
        if (
          result === PAYWALL_RESULT.PURCHASED ||
          result === PAYWALL_RESULT.RESTORED
        ) {
          console.log("[PaywallScreen] Purchase/restore successful — going back");
          router.back();
        } else if (result === PAYWALL_RESULT.NOT_PRESENTED) {
          // User already has entitlement — no paywall needed
          console.log("[PaywallScreen] Already subscribed — going back");
          router.back();
        } else {
          // CANCELLED or ERROR — go back
          console.log("[PaywallScreen] Paywall dismissed (cancelled/error) — going back");
          router.back();
        }
      })
      .catch((e) => {
        console.error("[PaywallScreen] presentPaywallIfNeeded error:", e);
        router.back();
      });
  }, [isLoading, paywallPresented, offering, router]);

  // Show a loading spinner while RevenueCat initialises / paywall is being presented
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <Text style={styles.loadingLabel}>Opening plans…</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.15)",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLabel: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
});
