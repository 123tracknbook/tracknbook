
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface CameraResult {
  uri: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  base64?: string;
}

export function useCamera() {
  const [isLoading, setIsLoading] = useState(false);

  const requestCameraPermission = async (): Promise<boolean> => {
    console.log('User requested camera permission');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Camera permission denied');
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      console.log('Camera permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    console.log('User requested media library permission');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Media library permission denied');
        Alert.alert(
          'Photo Library Permission Required',
          'Please enable photo library access in your device settings to select photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      console.log('Media library permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  };

  const takePicture = async (options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    base64?: boolean;
  }): Promise<CameraResult | null> => {
    console.log('User tapped Take Picture button');
    setIsLoading(true);

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: options?.allowsEditing ?? false,
        aspect: options?.aspect,
        quality: options?.quality ?? 0.8,
        base64: options?.base64 ?? false,
      });

      if (result.canceled) {
        console.log('User canceled camera');
        setIsLoading(false);
        return null;
      }

      const asset = result.assets[0];
      console.log('Photo captured:', asset.uri);

      setIsLoading(false);
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image',
        base64: asset.base64,
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      setIsLoading(false);
      return null;
    }
  };

  const recordVideo = async (options?: {
    allowsEditing?: boolean;
    quality?: ImagePicker.UIImagePickerControllerQualityType;
    videoMaxDuration?: number;
  }): Promise<CameraResult | null> => {
    console.log('User tapped Record Video button');
    setIsLoading(true);

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      console.log('Launching camera for video...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: options?.allowsEditing ?? false,
        videoQuality: options?.quality,
        videoMaxDuration: options?.videoMaxDuration,
      });

      if (result.canceled) {
        console.log('User canceled video recording');
        setIsLoading(false);
        return null;
      }

      const asset = result.assets[0];
      console.log('Video recorded:', asset.uri);

      setIsLoading(false);
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'video',
      };
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
      setIsLoading(false);
      return null;
    }
  };

  const pickImage = async (options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    base64?: boolean;
    allowsMultipleSelection?: boolean;
  }): Promise<CameraResult[] | null> => {
    console.log('User tapped Pick Image button');
    setIsLoading(true);

    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: options?.allowsEditing ?? false,
        aspect: options?.aspect,
        quality: options?.quality ?? 0.8,
        base64: options?.base64 ?? false,
        allowsMultipleSelection: options?.allowsMultipleSelection ?? false,
      });

      if (result.canceled) {
        console.log('User canceled image picker');
        setIsLoading(false);
        return null;
      }

      console.log(`Selected ${result.assets.length} image(s)`);

      const images = result.assets.map(asset => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image' as const,
        base64: asset.base64,
      }));

      setIsLoading(false);
      return images;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setIsLoading(false);
      return null;
    }
  };

  const pickVideo = async (options?: {
    allowsEditing?: boolean;
    quality?: ImagePicker.UIImagePickerControllerQualityType;
    videoMaxDuration?: number;
  }): Promise<CameraResult | null> => {
    console.log('User tapped Pick Video button');
    setIsLoading(true);

    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      console.log('Launching video picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: options?.allowsEditing ?? false,
        videoQuality: options?.quality,
        videoMaxDuration: options?.videoMaxDuration,
      });

      if (result.canceled) {
        console.log('User canceled video picker');
        setIsLoading(false);
        return null;
      }

      const asset = result.assets[0];
      console.log('Video selected:', asset.uri);

      setIsLoading(false);
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'video',
      };
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
      setIsLoading(false);
      return null;
    }
  };

  return {
    isLoading,
    takePicture,
    recordVideo,
    pickImage,
    pickVideo,
    requestCameraPermission,
    requestMediaLibraryPermission,
  };
}
