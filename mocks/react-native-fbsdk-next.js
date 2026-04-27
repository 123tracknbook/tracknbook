module.exports = {
  Settings: { initializeSDK: () => {}, setAppID: () => {}, setClientToken: () => {} },
  LoginManager: { logInWithPermissions: async () => ({ isCancelled: true }), logOut: () => {} },
  AccessToken: { getCurrentAccessToken: async () => null },
  GraphRequest: function() {},
  GraphRequestManager: function() { this.addRequest = () => this; this.start = () => {}; },
};
