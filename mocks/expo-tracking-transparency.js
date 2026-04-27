// Web stub for expo-tracking-transparency (iOS-only native module)
module.exports = {
  requestTrackingPermissionsAsync: async () => ({ status: 'unavailable', granted: false, expires: 'never', canAskAgain: false }),
  getTrackingPermissionsAsync: async () => ({ status: 'unavailable', granted: false, expires: 'never', canAskAgain: false }),
  isAvailable: () => false,
  PermissionStatus: { UNDETERMINED: 'undetermined', GRANTED: 'granted', DENIED: 'denied' },
};
