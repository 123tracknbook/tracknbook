import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Paywall } from "react-native-purchases-ui";

export default function PaywallScreen() {
  const router = useRouter();

  console.log("[PaywallScreen] rendering — showing inline RevenueCat paywall");

  const handlePurchaseCompleted = ({ customerInfo }: { customerInfo: any }) => {
    console.log("[PaywallScreen] Purchase completed — customerInfo:", JSON.stringify(customerInfo));
    router.back();
  };

  const handlePurchaseCancelled = () => {
    console.log("[PaywallScreen] Purchase cancelled — going back");
    router.back();
  };

  const handlePurchaseError = ({ error }: { error: any }) => {
    console.log("[PaywallScreen] Purchase error:", error);
    router.back();
  };

  const handleRestoreCompleted = ({ customerInfo }: { customerInfo: any }) => {
    console.log("[PaywallScreen] Restore completed — customerInfo:", JSON.stringify(customerInfo));
    router.back();
  };

  const handleDismiss = () => {
    console.log("[PaywallScreen] Paywall dismissed — going back");
    router.back();
  };

  return (
    <View style={styles.container}>
      <Paywall
        onPurchaseCompleted={handlePurchaseCompleted}
        onPurchaseCancelled={handlePurchaseCancelled}
        onPurchaseError={handlePurchaseError}
        onRestoreCompleted={handleRestoreCompleted}
        onDismiss={handleDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
