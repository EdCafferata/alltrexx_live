// webpack-dev-server v5 verwijderde de deprecated onBeforeSetupMiddleware/
// onAfterSetupMiddleware-opties (react-scripts 5.0.1 gebruikt nog die v4-API).
// Hier herbouwen we hetzelfde gedrag met de vervangende setupMiddlewares-API,
// zodat `npm start` blijft werken nu webpack-dev-server naar v5 is geüpgraded
// (Dependabot-alerts #3, #4, #8, #14, #33, #34).
//
// react-dev-utils/evalSourceMapMiddleware (het "view compiled source" linkje
// in de foutoverlay) is bewust NIET meegenomen: het leest `devServer._stats`,
// een privéveld dat in webpack-dev-server v5 niet meer bestaat (geverifieerd:
// geen enkele match in de hele lib/-map). react-dev-utils is nooit bijgewerkt
// voor v5, dus dit was hoe dan ook altijd een no-op geworden — nu gewoon
// weggelaten in plaats van op elk request een genegeerde exception te gooien.
const redirectServedPathMiddleware = require('react-dev-utils/redirectServedPathMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');

module.exports = {
  devServer: (devServerConfig, { paths }) => {
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;

    // webpack-dev-server v5 verving de losse `https`-optie (bool | {cert,key},
    // via react-scripts' getHttpsConfig()) door `server`.
    const https = devServerConfig.https;
    delete devServerConfig.https;
    if (https === true) {
      devServerConfig.server = 'https';
    } else if (https && typeof https === 'object') {
      devServerConfig.server = { type: 'https', options: https };
    }
    // https === false (standaard, geen HTTPS env-vars gezet) → gewoon weglaten,
    // v5 default is 'http'.

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is niet beschikbaar');
      }

      // was onAfterSetupMiddleware
      middlewares.push({
        name: 'redirect-served-path-middleware',
        middleware: redirectServedPathMiddleware(paths.publicUrlOrPath),
      });
      middlewares.push({
        name: 'noop-service-worker-middleware',
        middleware: noopServiceWorkerMiddleware(paths.publicUrlOrPath),
      });

      return middlewares;
    };

    return devServerConfig;
  },
};
