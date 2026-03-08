
# Camera Access Documentation

This app now has full camera and photo library access capabilities.

## Features

- **Take Photos**: Capture photos using the device camera
- **Record Videos**: Record videos with the device camera
- **Pick Images**: Select images from the photo library
- **Pick Videos**: Select videos from the photo library
- **Permission Handling**: Automatic permission requests with user-friendly messages
- **Cross-Platform**: Works on iOS, Android, and Web (where supported)

## Permissions

### iOS
The following permissions are configured in `app.json`:
- `NSCameraUsageDescription`: Camera access for taking photos
- `NSPhotoLibraryUsageDescription`: Photo library access for selecting photos
- `NSMicrophoneUsageDescription`: Microphone access for recording videos

### Android
The following permissions are configured in `app.json`:
- `CAMERA`: Camera access
- `READ_EXTERNAL_STORAGE`: Read photos/videos from storage
- `WRITE_EXTERNAL_STORAGE`: Save photos/videos to storage
- `READ_MEDIA_IMAGES`: Read images (Android 13+)
- `READ_MEDIA_VIDEO`: Read videos (Android 13+)

## Usage

### Using the useCamera Hook

```typescript
import { useCamera } from '@/hooks/useCamera';

function MyComponent() {
  const { takePicture, pickImage, isLoading } = useCamera();

  const handleTakePhoto = async () => {
    const result = await takePicture({
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (result) {
      console.log('Photo URI:', result.uri);
      // Use the photo URI to display or upload
    }
  };

  return (
    <TouchableOpacity onPress={handleTakePhoto} disabled={isLoading}>
      <Text>Take Photo</Text>
    </TouchableOpacity>
  );
}
```

### Available Methods

#### `takePicture(options?)`
Launches the camera to take a photo.

Options:
- `allowsEditing?: boolean` - Allow user to edit/crop the photo
- `aspect?: [number, number]` - Aspect ratio for editing (e.g., [4, 3])
- `quality?: number` - Image quality (0-1, default: 0.8)
- `base64?: boolean` - Include base64 data in result

Returns: `CameraResult | null`

#### `recordVideo(options?)`
Launches the camera to record a video.

Options:
- `allowsEditing?: boolean` - Allow user to edit the video
- `quality?: UIImagePickerControllerQualityType` - Video quality
- `videoMaxDuration?: number` - Maximum video duration in seconds

Returns: `CameraResult | null`

#### `pickImage(options?)`
Opens the photo library to select images.

Options:
- `allowsEditing?: boolean` - Allow user to edit/crop the image
- `aspect?: [number, number]` - Aspect ratio for editing
- `quality?: number` - Image quality (0-1, default: 0.8)
- `base64?: boolean` - Include base64 data in result
- `allowsMultipleSelection?: boolean` - Allow selecting multiple images

Returns: `CameraResult[] | null`

#### `pickVideo(options?)`
Opens the photo library to select a video.

Options:
- `allowsEditing?: boolean` - Allow user to edit the video
- `quality?: UIImagePickerControllerQualityType` - Video quality
- `videoMaxDuration?: number` - Maximum video duration

Returns: `CameraResult | null`

#### `requestCameraPermission()`
Manually request camera permission.

Returns: `Promise<boolean>`

#### `requestMediaLibraryPermission()`
Manually request photo library permission.

Returns: `Promise<boolean>`

### CameraResult Interface

```typescript
interface CameraResult {
  uri: string;           // Local file URI
  width: number;         // Image/video width
  height: number;        // Image/video height
  type: 'image' | 'video'; // Media type
  base64?: string;       // Base64 data (if requested)
}
```

## Demo Screen

A demo screen is available at `/camera-demo` that shows all camera functionality in action. You can:
- Take photos with the camera
- Record videos
- Pick images from the library
- Pick videos from the library
- See previews and metadata of captured media

## WebView Integration

The WebView in the home screen is configured to support camera access from web content:
- `mediaPlaybackRequiresUserAction={false}` - Allow automatic media playback
- `allowsInlineMediaPlayback={true}` - Allow inline video playback
- `allowsFullscreenVideo={true}` - Allow fullscreen video
- `geolocationEnabled={true}` - Enable geolocation (often needed with camera)

This means if the web app (tracknbook.app) requests camera access via HTML5 APIs, it will work seamlessly.

## Best Practices

1. **Always check permissions**: The hook automatically requests permissions, but you can manually check with `requestCameraPermission()` or `requestMediaLibraryPermission()`

2. **Handle loading states**: Use the `isLoading` state to show loading indicators and disable buttons during camera operations

3. **Handle null results**: Users can cancel camera/picker operations, so always check if the result is null

4. **Optimize image quality**: Use the `quality` option to balance file size and image quality (0.8 is a good default)

5. **Consider editing**: Enable `allowsEditing` to let users crop/adjust photos before using them

6. **Log user actions**: The hook includes console.log statements for debugging user flows

## Troubleshooting

### Camera not working on iOS
- Ensure all permission descriptions are set in `app.json`
- Check that the app has been rebuilt after adding permissions
- Verify permissions in iOS Settings > [Your App]

### Camera not working on Android
- Ensure all permissions are declared in `app.json`
- For Android 13+, ensure `READ_MEDIA_IMAGES` and `READ_MEDIA_VIDEO` are included
- Check that the app has been rebuilt after adding permissions

### WebView camera not working
- Ensure the WebView has all media-related props enabled
- Check browser console for permission errors
- Some web APIs may require HTTPS

## Example: Upload Photo to Backend

```typescript
const handleUploadPhoto = async () => {
  const photo = await takePicture({ quality: 0.7 });
  
  if (!photo) return;

  const formData = new FormData();
  formData.append('image', {
    uri: photo.uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  try {
    const response = await fetch('https://your-api.com/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const result = await response.json();
    console.log('Upload successful:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```
