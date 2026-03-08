
import React from "react";
import { IconSymbol } from "@/components/IconSymbol";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";

const webAppUrl = "https://www.tracknbook.app";
const supportEmail = "support@tracknbook.app";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
});

export default function ProfileScreen() {
  const { colors } = useTheme();

  const handleOpenWebsite = () => {
    console.log('Opening website:', webAppUrl);
    window.open(webAppUrl, '_blank');
  };

  const handleSupport = () => {
    console.log('Opening email client for support');
    window.location.href = `mailto:${supportEmail}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>
            Track n Book - Your companion app for managing bookings and tracking.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={handleOpenWebsite}
          >
            <IconSymbol
              ios_icon_name="safari"
              android_material_icon_name="language"
              size={24}
              color={colors.text}
            />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Open in Browser
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={handleSupport}
          >
            <IconSymbol
              ios_icon_name="envelope"
              android_material_icon_name="email"
              size={24}
              color={colors.text}
            />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Contact Support
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Support
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>
            Need help? Contact us at {supportEmail}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
