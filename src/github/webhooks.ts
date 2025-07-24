import { Webhooks, createNodeMiddleware } from '@octokit/webhooks';
import { PushEvent } from '@octokit/webhooks-types';
import { sendCommitNotification, deleteWebhook } from './handler';
import { getChannelForRepository, unassignRepository } from '../db/database';
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
        // untrack repo: delete webhook and unassign from db
        await deleteWebhook(repository);
        await unassignRepository(repository);
        console.log(`❌ Untracked repo ${repository} due to missing channel assignment.`);
        return;
      }

      let channel;
      try {
        channel = await client.channels.fetch(channelId);
      } catch (err) {
        // channel fetch failed (likely deleted)
        await deleteWebhook(repository);
        await unassignRepository(repository);
        console.log(`❌ Untracked repo ${repository} due to unknown or deleted channel.`);
        return;
      }

      if (!channel || channel.type !== 0) { // 0 = GuildText
        await deleteWebhook(repository);
        await unassignRepository(repository);
        console.log(`❌ Untracked repo ${repository} due to invalid or missing text channel.`);
        return;
      }

      await sendCommitNotification(channel, payload as PushEvent);
    });

    // handle ping event from github to acknowledge webhook setup
    webhooks.on('ping', async ({ id, name, payload }) => {
      console.log('received ping event from github:', payload.zen);
      // nothing else needed; middleware will respond with 200 OK
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