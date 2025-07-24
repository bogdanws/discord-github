// github webhook handler for discord-github bot
// features:
// - commit notifications with embed messages
// - revert button for each commit (admin only)
// - github api integration for commit operations
import { PushEvent } from '@octokit/webhooks-types';
import { TextChannel, EmbedBuilder, ColorResolvable, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } from 'discord.js';
import { App } from 'octokit';

// github app instance (initialized lazily)
let app: App | null = null;

// initialize github client (called after env vars are loaded)
function initializeGitHubClient() {
  if (!app) {
    app = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_PRIVATE_KEY!,
      webhooks: {
        secret: process.env.GITHUB_WEBHOOK_SECRET!,
      },
    });
  }
  return app;
}

// get octokit instance for a specific repository
async function getOctokit(repoFullName: string) {
  const githubApp = initializeGitHubClient();
  
  // get installation ID for this specific repository
  const [owner, repo] = repoFullName.split('/');
  
  try {
    // automatically get the installation for this repository
    // this replaces the need for a static GITHUB_INSTALLATION_ID environment variable
    const installation = await githubApp.octokit.rest.apps.getRepoInstallation({
      owner,
      repo
    });
    
    // get octokit instance for this specific installation
    return await githubApp.getInstallationOctokit(installation.data.id);
  } catch (error) {
    console.error(`❌ Error getting installation for ${repoFullName}:`, error);
    throw new Error(`GitHub App not installed on repository ${repoFullName}`);
  }
}

export async function createWebhook(repoFullName: string) {
  const [owner, repo] = repoFullName.split('/');
  const octokitInstance = await getOctokit(repoFullName);

  await octokitInstance.request('POST /repos/{owner}/{repo}/hooks', {
    owner,
    repo,
    name: 'web',
    active: true,
    events: ['push'],
    config: {
      url: `http://${process.env.WEBHOOK_DOMAIN}:3000/webhooks`,
      content_type: 'json',
      secret: process.env.GITHUB_WEBHOOK_SECRET!,
    },
  });
}

export async function deleteWebhook(repoFullName: string): Promise<boolean> {
  try {
    const [owner, repo] = repoFullName.split('/');
    const octokitInstance = await getOctokit(repoFullName);
    // list all webhooks for the repo
    const hooks = await octokitInstance.rest.repos.listWebhooks({ owner, repo });
    const targetUrl = `http://${process.env.WEBHOOK_DOMAIN}:3000/webhooks`;
    const hook = hooks.data.find(h => h.config && h.config.url === targetUrl);
    if (!hook) return false;
    await octokitInstance.rest.repos.deleteWebhook({ owner, repo, hook_id: hook.id });
    return true;
  } catch (e) {
    console.error('❌ Error deleting webhook:', e);
    return false;
  }
} 

// send commit notification to discord channel
export async function sendCommitNotification(
  channel: TextChannel,
  event: PushEvent
): Promise<void> {
  try {
    const { repository, commits, head_commit, pusher } = event;

    // A push event with no head_commit indicates a branch deletion
    if (!head_commit) {
      console.log('⚠️ Received a push event without a head_commit, likely a branch deletion. Ignoring.');
      return;
    }

    const textChannel = channel;
    
    // create embed for commit notification
    const embed = new EmbedBuilder()
      .setTitle(`📝 New commits pushed to ${repository.name}`)
      .setDescription(`**${commits.length} commit${commits.length > 1 ? 's' : ''}** by **${pusher.name}**`)
      .setColor(getCommitColor(commits.length) as ColorResolvable)
      .setURL(repository.html_url)
      .setTimestamp(new Date(head_commit.timestamp))
      .setFooter({ text: `Repository: ${repository.full_name}` });

    // add commit details
    if (commits.length === 1) {
      // single commit - show full details
      const commit = commits[0];
      embed.addFields(
        { name: 'Commit Message', value: commit.message.split('\n')[0] || 'No message' },
        { name: 'Commit Hash', value: `\`${commit.id.substring(0, 7)}\``, inline: true },
        { name: 'Author', value: commit.author.name, inline: true }
      );
    } else {
      // multiple commits - show summary
      const commitMessages = commits
        .slice(0, 5) // show first 5 commits
        .map(commit => `• \`${commit.id.substring(0, 7)}\` ${commit.message.split('\n')[0]}`)
        .join('\n');
      
      embed.addFields({
        name: `Recent Commits (${commits.length} total)`,
        value: commitMessages + (commits.length > 5 ? '\n...' : '')
      });
    }

    // create revert dropdown (string select menu)
    const { StringSelectMenuBuilder } = await import('discord.js');
    const options = commits.slice(0, 5).map(commit => ({
      label: commit.message.split('\n')[0].slice(0, 80) || 'No message',
      description: `by ${commit.author.name} • ${commit.id.substring(0, 7)}`,
      value: commit.id
    }));
    const revertDropdown = new StringSelectMenuBuilder()
      .setCustomId(`revert_select_${repository.full_name}`)
      .setPlaceholder('Select a commit to revert')
      .addOptions(options);
    const row = new ActionRowBuilder().addComponents(revertDropdown);
    await textChannel.send({ embeds: [embed], components: [row.toJSON()] });
    console.log(`✅ Sent commit notification for ${repository.name} to #${textChannel.name}`);
    
  } catch (error) {
    console.error('❌ Error sending commit notification:', error);
  }
}

// get color based on number of commits
function getCommitColor(commitCount: number): string {
  if (commitCount === 1) return '#00ff00'; // green for single commit
  if (commitCount <= 3) return '#ffff00'; // yellow for small batch
  if (commitCount <= 10) return '#ffa500'; // orange for medium batch
  return '#ff0000'; // red for large batch
}

// get repository information from github
export async function getRepositoryInfo(repoFullName: string) {
  try {
    const [owner, repo] = repoFullName.split('/');
    const octokitInstance = await getOctokit(repoFullName);
    const response = await octokitInstance.rest.repos.get({ owner, repo });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching repository info:', error);
    return null;
  }
}

// test function to simulate commit notification
export async function testCommitNotification(channel?: TextChannel): Promise<'ok' | 'no_channel' | 'invalid_channel' | 'error'> {
  try {
    let targetChannel = channel;
    if (!targetChannel) {
      const { getChannelForRepository } = await import('../db/database.js');
      const { client } = await import('../index.js');
      const channelId = await getChannelForRepository('testuser/test-repo');
      if (!channelId) return 'no_channel';
      const fetchedChannel = await client.channels.fetch(channelId);
      if (!fetchedChannel || fetchedChannel.type !== 0) return 'invalid_channel'; // 0 = GuildText
      targetChannel = fetchedChannel;
    }

    const testEvent = {
      ref: 'refs/heads/main',
      before: 'abc123',
      after: 'def456',
      repository: {
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        html_url: 'https://github.com/testuser/test-repo'
      },
      commits: [
        {
          id: 'def456789',
          message: 'test: add sample commit for testing',
          author: {
            name: 'Test User',
            email: 'test@example.com'
          },
          url: 'https://github.com/testuser/test-repo/commit/def456789',
          timestamp: new Date().toISOString()
        }
      ],
      head_commit: {
        id: 'def456789',
        message: 'test: add sample commit for testing',
        author: {
          name: 'Test User',
          email: 'test@example.com'
        },
        url: 'https://github.com/testuser/test-repo/commit/def456789',
        timestamp: new Date().toISOString()
      },
      pusher: {
        name: 'Test User',
        email: 'test@example.com'
      }
    };

    await sendCommitNotification(targetChannel, testEvent as PushEvent);
    return 'ok';
  } catch (e) {
    return 'error';
  }
}

// handle revert button interaction
export async function handleRevertCommit(
  repositoryFullName: string,
  commitId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const [owner, repo] = repositoryFullName.split('/');
    const octokitInstance = await getOctokit(repositoryFullName);
    
    // get commit details
    const commitResponse = await octokitInstance.rest.repos.getCommit({
      owner,
      repo,
      ref: commitId
    });
    
    const commit = commitResponse.data;
    
    // get the current head of the main branch
    const branchResponse = await octokitInstance.rest.repos.getBranch({
      owner,
      repo,
      branch: 'main'
    });
    
    const currentHeadSha = branchResponse.data.commit.sha;
    
    // get the parent commit's tree (what we want to revert to)
    if (!commit.parents || commit.parents.length === 0) {
      return {
        success: false,
        message: '❌ Cannot revert initial commit (no parent commit found)'
      };
    }
    
    const parentTreeSha = commit.parents[0].sha;
    
    // get the parent commit to get its tree
    const parentCommitResponse = await octokitInstance.rest.repos.getCommit({
      owner,
      repo,
      ref: parentTreeSha
    });
    
    // create revert commit using git API
    const revertCommit = await octokitInstance.rest.git.createCommit({
      owner,
      repo,
      message: `Revert "${commit.commit.message.split('\n')[0]}"\n\nThis reverts commit ${commitId}.\n\nReverted by Discord user: ${userId}`,
      tree: parentCommitResponse.data.commit.tree.sha,
      parents: [currentHeadSha]
    });
    
    // update the main branch to point to the new revert commit
    await octokitInstance.rest.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: revertCommit.data.sha
    });
    
    console.log(`✅ Successfully reverted commit ${commitId} in ${repositoryFullName}`);
    
    return {
      success: true,
      message: `✅ Successfully reverted commit \`${commitId.substring(0, 7)}\` in ${repositoryFullName}`
    };
    
  } catch (error) {
    console.error('❌ Error reverting commit:', error);
    
    return {
      success: false,
      message: `❌ Failed to revert commit: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
