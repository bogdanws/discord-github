import { createServer } from 'http';
import { getWebhooksMiddleware } from './github/webhooks';

const PORT = process.env.PORT || 3000;

export function startServer() {
  const server = createServer((req, res) => {
    // let the middleware handle the request
    const middleware = getWebhooksMiddleware();
    middleware(req, res);
  }).listen(PORT, () => {
    console.log(`🚀 Webhook server is running on port ${PORT}`);
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });
}