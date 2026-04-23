import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Purchases from "react-native-purchases";
import type { PurchasesOffering } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import type { CustomerInfo, PurchasesError, PurchasesStoreTransaction } from "react-native-purchases";

export default function PaywallScreen() {
  const router = useRouter();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringLoaded, setOfferingLoaded] = useState(false);

  // Fetch all offerings on mount so we can pass the correct one to the Paywall.
  // Without this, RevenueCatUI.Paywall defaults to the "current" offering which
  // may not be the one with your custom dashboard template.
  useEffect(() => {
    console.log("[PaywallScreen] fetching offerings from RevenueCat");
    Purchases.getOfferings()
      .then((offerings) => {
        console.log(
          "[PaywallScreen] offerings fetched — all identifiers:",
          Object.keys(offerings.all),
          "| current:", offerings.current?.identifier ?? "null"
        );
        // Use the current offering (the one marked as current in the RC dashboard).
        // If your custom-template offering has a different identifier, set it here:
        //   const target = offerings.all["your_offering_id"] ?? offerings.current;
        const target = offerings.current;
        if (!target) {
          console.warn("[PaywallScreen] no current offering found — paywall will use RC default");
        } else {
          console.log(
            "[PaywallScreen] using offering:", target.identifier,
            "| packages:", target.availablePackages.map((p) => p.identifier)
          );
        }
        setOffering(target);
      })
      .catch((e) => {
        console.warn("[PaywallScreen] getOfferings error:", e);
        // Leave offering as null — RevenueCatUI.Paywall will fall back to its own fetch
      })
      .finally(() => {
        setOfferingLoaded(true);
      });
  }, []);

  console.log("[PaywallScreen] rendering — offeringLoaded:", offeringLoaded, "| offeringId:", offering?.identifier ?? "null");

  const handleClose = () => {
    console.log("[PaywallScreen] close button pressed — going back");
    router.back();
  };

  const handlePurchaseCompleted = ({
    customerInfo,
    storeTransaction,
  }: {
    customerInfo: CustomerInfo;
    storeTransaction: PurchasesStoreTransaction;
  }) => {
    console.log(
      "[PaywallScreen] onPurchaseCompleted — activeEntitlements:",
      Object.keys(customerInfo.entitlements.active),
      "| productId:",
      storeTransaction.productIdentifier
    );
    router.back();
  };

  const handlePurchaseCancelled = () => {
    console.log("[PaywallScreen] onPurchaseCancelled — going back");
    router.back();
  };

  const handlePurchaseError = ({ error }: { error: PurchasesError }) => {
    console.warn("[PaywallScreen] onPurchaseError:", error.message, "| code:", error.code);
    router.back();
  };

  const handleRestoreCompleted = ({ customerInfo }: { customerInfo: CustomerInfo }) => {
    console.log(
      "[PaywallScreen] onRestoreCompleted — activeEntitlements:",
      Object.keys(customerInfo.entitlements.active)
    );
    router.back();
  };

  const handleDismiss = () => {
    console.log("[PaywallScreen] onDismiss — going back");
    router.back();
  };

  // Wait until we've attempted to load the offering before rendering the Paywall.
  // Rendering RevenueCatUI.Paywall before RC has resolved its offerings can cause
  // it to fall back to a built-in default template instead of the dashboard one.
  if (!offeringLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  const paywallOptions = offering ? { offering } : undefined;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={12}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.paywallWrapper}>
        <RevenueCatUI.Paywall
          options={paywallOptions}
          onPurchaseCompleted={handlePurchaseCompleted}
          onPurchaseCancelled={handlePurchaseCancelled}
          onPurchaseError={handlePurchaseError}
          onRestoreCompleted={handleRestoreCompleted}
          onDismiss={handleDismiss}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  paywallWrapper: {
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
