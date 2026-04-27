module.exports = {
  requestTrackingPermissionsAsync: async () => ({ status: 'unavailable' }),
  getTrackingPermissionsAsync: async () => ({ status: 'unavailable' }),
  PermissionStatus: { UNDETERMINED: 'undetermined', GRANTED: 'granted', DENIED: 'denied' },
};
