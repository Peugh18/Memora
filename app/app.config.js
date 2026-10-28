// En EAS, google-services.json llega como archivo secreto (variable GOOGLE_SERVICES_JSON) porque no está en git.
module.exports = ({ config }) => ({
  ...config,
  android: { ...config.android, googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json' },
});
