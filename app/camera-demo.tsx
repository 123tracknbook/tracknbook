
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useCamera, CameraResult } from '@/hooks/useCamera';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.7,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 10,
  },
  imageInfo: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default function CameraDemoScreen() {
  const { colors } = useTheme();
  const {
    isLoading,
    takePicture,
    recordVideo,
    pickImage,
    pickVideo,
  } = useCamera();

  const [capturedMedia, setCapturedMedia] = useState<CameraResult | null>(null);

  const handleTakePicture = async () => {
    console.log('User tapped Take Picture');
    const result = await takePicture({
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (result) {
      console.log('Picture taken successfully');
      setCapturedMedia(result);
    }
  };

  const handleRecordVideo = async () => {
    console.log('User tapped Record Video');
    const result = await recordVideo({
      allowsEditing: false,
      videoMaxDuration: 60,
    });
    
    if (result) {
      console.log('Video recorded successfully');
      setCapturedMedia(result);
    }
  };

  const handlePickImage = async () => {
    console.log('User tapped Pick Image');
    const results = await pickImage({
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    
    if (results && results.length > 0) {
      console.log('Image picked successfully');
      setCapturedMedia(results[0]);
    }
  };

  const handlePickVideo = async () => {
    console.log('User tapped Pick Video');
    const result = await pickVideo({
      allowsEditing: false,
    });
    
    if (result) {
      console.log('Video picked successfully');
      setCapturedMedia(result);
    }
  };

  const titleColor = colors.text;
  const descriptionColor = colors.text;
  const buttonBackgroundColor = colors.primary;
  const buttonTextColor = '#FFFFFF';
  const previewTitleColor = colors.text;
  const infoTextColor = colors.text;
  const loadingTextColor = colors.text;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Camera Demo',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: titleColor }]}>
          Camera Access Demo
        </Text>
        <Text style={[styles.description, { color: descriptionColor }]}>
          Test camera and photo library access with the buttons below.
        </Text>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={buttonBackgroundColor} />
            <Text style={[styles.loadingText, { color: loadingTextColor }]}>
              Processing...
            </Text>
          </View>
        )}

        {!isLoading && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonBackgroundColor }]}
              onPress={handleTakePicture}
            >
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera"
                size={24}
                color={buttonTextColor}
              />
              <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                Take Picture
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonBackgroundColor }]}
              onPress={handleRecordVideo}
            >
              <IconSymbol
                ios_icon_name="video.fill"
                android_material_icon_name="videocam"
                size={24}
                color={buttonTextColor}
              />
              <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                Record Video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonBackgroundColor }]}
              onPress={handlePickImage}
            >
              <IconSymbol
                ios_icon_name="photo.fill"
                android_material_icon_name="image"
                size={24}
                color={buttonTextColor}
              />
              <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                Pick Image from Library
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonBackgroundColor }]}
              onPress={handlePickVideo}
            >
              <IconSymbol
                ios_icon_name="film.fill"
                android_material_icon_name="movie"
                size={24}
                color={buttonTextColor}
              />
              <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                Pick Video from Library
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {capturedMedia && (
          <View style={styles.previewContainer}>
            <Text style={[styles.previewTitle, { color: previewTitleColor }]}>
              Preview
            </Text>
            
            {capturedMedia.type === 'image' && (
              <Image
                source={{ uri: capturedMedia.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}
            
            <Text style={[styles.imageInfo, { color: infoTextColor }]}>
              Type: {capturedMedia.type}
            </Text>
            <Text style={[styles.imageInfo, { color: infoTextColor }]}>
              Size: {capturedMedia.width} x {capturedMedia.height}
            </Text>
            <Text style={[styles.imageInfo, { color: infoTextColor }]}>
              URI: {capturedMedia.uri}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
