import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    WEB_CLIENT_ID: process.env.EXPO_WEB_CLIENT_ID,
    IOS_CLIENT_ID: process.env.EXPO_IOS_CLIENT_ID,
  },
});