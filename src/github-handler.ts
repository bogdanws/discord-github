// github webhook handler for discord-github bot
// features:
// - commit notifications with embed messages
// - revert button for each commit (admin only)
// - github api integration for commit operations
import { TextChannel, EmbedBuilder, ColorResolvable, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Octokit } from 'octokit';
import { PushEvent } from '@octokit/webhooks-types';

// initialize github client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

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

    // create revert button
    const revertButton = new ButtonBuilder()
      .setCustomId(`revert_prompt_${repository.full_name}_${head_commit.id}`)
      .setLabel('🔄 Revert')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('⚠️');

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(revertButton);

    await channel.send({ embeds: [embed], components: [row] });
    console.log(`✅ Sent commit notification for ${repository.name}`);
    
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
    const response = await octokit.rest.repos.get({ owner, repo });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching repository info:', error);
    return null;
  }
}

// test function to simulate commit notification
export async function testCommitNotification(channel: TextChannel): Promise<void> {
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

  await sendCommitNotification(channel, testEvent as PushEvent);
}

// handle revert button interaction
export async function handleRevertCommit(
  repositoryFullName: string,
  commitId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const [owner, repo] = repositoryFullName.split('/');
    
    // get commit details
    const commitResponse = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: commitId
    });
    
    const commit = commitResponse.data;
    
    // create revert commit
    const revertResponse = await octokit.rest.repos.createCommit({
      owner,
      repo,
      message: `Revert "${commit.commit.message.split('\n')[0]}"\n\nThis reverts commit ${commitId}.\n\nReverted by Discord user: ${userId}`,
      tree: commit.parents[0].sha, // revert to parent commit
      parents: [commit.parents[0].sha]
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