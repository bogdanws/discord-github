import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';

import { testCommitNotification } from '../../../github/handler.js';
import { hasAdminPermissions } from '../../../utils/index.js';

export default {
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('admin-only commands')
		.addSubcommand(subcommand =>
			subcommand
				.setName('help')
				.setDescription('show admin commands'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('test-commit')
				.setDescription('test commit notification')),
	async execute(interaction: ChatInputCommandInteraction) {
		// check if user has admin permissions
		if (!interaction.member || !hasAdminPermissions(interaction.member, interaction.client)) {
			await interaction.reply({
				content: '❌ You do not have permission to use admin commands. You need either the Administrator permission or the configured admin role.',
				ephemeral: true
			});
			return;
		}

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'help') {
			await interaction.reply({
				content: '👑 **Admin Commands:**\n• `/admin test-commit` - test commit notification\n• `/revert` - revert a specific commit\n• `/admin webhook-status` - check webhook status (coming soon)',
				ephemeral: true
			});
		} else if (subcommand === 'test-commit') {
			await interaction.reply({
				content: '🧪 Testing commit notification for repository `testuser/test-repo`...',
				ephemeral: true
			});
			try {
				const result = await testCommitNotification();
				if (result === 'no_channel') {
					await interaction.followUp({
						content: '❌ No channel assigned to `testuser/test-repo`. Please assign a channel first.',
						ephemeral: true
					});
				} else if (result === 'invalid_channel') {
					await interaction.followUp({
						content: '❌ The assigned channel for `testuser/test-repo` is invalid or not a text channel.',
						ephemeral: true
					});
				} else if (result === 'ok') {
					await interaction.followUp({
						content: '✅ Test commit notification sent successfully! Make sure you have assigned `testuser/test-repo` to a channel.',
						ephemeral: true
					});
				} else {
					await interaction.followUp({
						content: '❌ Failed to send test commit notification.',
						ephemeral: true
					});
				}
			} catch (error) {
				console.error('❌ Error testing commit notification:', error);
				await interaction.followUp({
					content: '❌ Failed to send test commit notification.',
					ephemeral: true
				});
			}
		}
	},
}; 