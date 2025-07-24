import { Webhooks, createNodeMiddleware } from '@octokit/webhooks';
import { PushEvent } from '@octokit/webhooks-types';
import { sendCommitNotification } from './handler';
import { getChannelForRepository } from '../db/database';
import { client } from '../index';
import { EmbedBuilder, TextChannel } from 'discord.js';

// webhooks instance (initialized lazily)
let webhooks: Webhooks | null = null;
let middleware: any = null;

// initialize webhooks (called after env vars are loaded)
function initializeWebhooks() {
  if (!webhooks) {
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      throw new Error('GITHUB_WEBHOOK_SECRET is not set');
    }

    webhooks = new Webhooks({
      secret: process.env.GITHUB_WEBHOOK_SECRET,
    });

    webhooks.on('push', async ({ id, name, payload }) => {
      console.log(name, 'event received');
      const repository = payload.repository.full_name;
      const commits = payload.commits;

      if (commits.length === 0) {
        return;
      }

      const channelId = await getChannelForRepository(repository);
      if (!channelId) {
        return;
      }

      const channel = await client.channels.fetch(channelId) as TextChannel;
      if (!channel) {
        return;
      }

      await sendCommitNotification(channel, payload as PushEvent);
    });

    webhooks.onError((error) => {
      console.error('Error in webhooks handler:', error);
    });

    middleware = createNodeMiddleware(webhooks, { path: '/webhooks' });
  }
  return { webhooks, middleware };
}

// export getter function for middleware
export function getWebhooksMiddleware() {
  const { middleware: webhooksMiddleware } = initializeWebhooks();
  return webhooksMiddleware;
}