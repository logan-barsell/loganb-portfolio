const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxy only /api to the local Express server.
 * Avoids the package.json "proxy" field, which breaks CRA allowedHosts / HMR.
 */
module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3001',
      changeOrigin: true,
    })
  );
};
