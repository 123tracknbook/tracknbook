import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import RevenueCatUI from "react-native-purchases-ui";
import type { CustomerInfo, PurchasesError, PurchasesStoreTransaction } from "react-native-purchases";

export default function PaywallScreen() {
  const router = useRouter();

  console.log("[PaywallScreen] rendering native RevenueCat paywall");

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

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={12}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.paywallWrapper}>
        <RevenueCatUI.Paywall
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
});
