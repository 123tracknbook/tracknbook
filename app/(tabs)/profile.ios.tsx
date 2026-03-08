
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { IconSymbol } from "@/components/IconSymbol";

export default function ProfileScreen() {
  const theme = useTheme();

  const handleOpenWebsite = () => {
    console.log("User tapped Open Website button");
    // Replace with your Lovable web app URL
    Linking.openURL("https://your-lovable-app.lovable.app");
  };

  const handleSupport = () => {
    console.log("User tapped Support button");
    Linking.openURL("mailto:support@yourapp.com");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="person.circle.fill"
            android_material_icon_name="account-circle"
            size={80}
            color={theme.colors.primary}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            App Settings
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.dark ? '#2C2C2E' : '#F2F2F7' }]}
            onPress={handleOpenWebsite}
          >
            <IconSymbol
              ios_icon_name="safari"
              android_material_icon_name="language"
              size={24}
              color={theme.colors.text}
            />
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              Open in Browser
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={theme.dark ? '#8E8E93' : '#C7C7CC'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.dark ? '#2C2C2E' : '#F2F2F7' }]}
            onPress={handleSupport}
          >
            <IconSymbol
              ios_icon_name="envelope.fill"
              android_material_icon_name="email"
              size={24}
              color={theme.colors.text}
            />
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              Contact Support
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={theme.dark ? '#8E8E93' : '#C7C7CC'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.dark ? '#8E8E93' : '#8E8E93' }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  section: {
    gap: 12,
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  buttonText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
  },
});
