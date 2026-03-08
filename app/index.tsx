
import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Remove any default margins/padding from body and html
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          overflow: hidden !important;
          background-color: transparent !important;
        }
        * {
          box-sizing: border-box;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return <Redirect href="/home" />;
}
