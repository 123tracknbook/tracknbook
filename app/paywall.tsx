import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  console.log("[PaywallScreen] rendering — native paywall stub (react-native-purchases-ui not installed)");

  const handleClose = () => {
    console.log("[PaywallScreen] Close button pressed — going back");
    router.back();
  };

  const handleRestore = () => {
    console.log("[PaywallScreen] Restore purchases pressed");
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={styles.subtitle}>
          Unlock the full TracknBook experience
        </Text>

        <View style={styles.featuresContainer}>
          <FeatureRow icon="✓" text="Unlimited jobs and bookings" />
          <FeatureRow icon="✓" text="Advanced reporting and analytics" />
          <FeatureRow icon="✓" text="Priority customer support" />
          <FeatureRow icon="✓" text="Team collaboration tools" />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            console.log("[PaywallScreen] Subscribe button pressed");
            router.back();
          }}
        >
          <Text style={styles.primaryButtonText}>Subscribe Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a1f2e",
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
  content: {
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  featureIcon: {
    fontSize: 18,
    color: "#4ade80",
    marginRight: 14,
    width: 24,
    textAlign: "center",
  },
  featureText: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  restoreButton: {
    paddingVertical: 12,
  },
  restoreText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
  },
});
