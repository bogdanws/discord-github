import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChatInputCommandInteraction } from 'discord.js';

import { handleRevertCommit } from '../../../github/handler.js';
import { hasAdminPermissions } from '../../../utils/index.js';

export default {
	data: new SlashCommandBuilder()
		.setName('revert')
		.setDescription('revert a specific commit')
		.addStringOption(option =>
			option.setName('commit_hash')
				.setDescription('the commit hash to revert')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('repository')
				.setDescription('repository in format owner/repo (optional, will use default if not specified)')
				.setRequired(false)),
	async execute(interaction: ChatInputCommandInteraction) {
		// check if user has admin permissions
		if (!interaction.member || !hasAdminPermissions(interaction.member, interaction.client)) {
			await interaction.reply({ 
				content: '❌ You do not have permission to revert commits. You need either the Administrator permission or the configured admin role.', 
				ephemeral: true 
			});
			return;
		}

		const commitHash = interaction.options.getString('commit_hash');
		const repository = interaction.options.getString('repository');

		// only allow direct revert if both parameters are provided
		if (commitHash && repository) {
			await this.executeRevert(interaction, commitHash, repository);
			return;
		}

		await interaction.reply({
			content: '❌ You must provide both a commit hash and a repository to use this command. Use the dropdown in commit notifications for interactive revert.',
			ephemeral: true
		});
	},

	// separate method to execute the actual revert
	async executeRevert(interaction: ChatInputCommandInteraction, commitHash: string, repository: string) {
		if (!repository) {
			await interaction.reply({ 
				content: '❌ No repository specified and no default repository configured. Please specify a repository in format owner/repo.', 
				ephemeral: true 
			});
			return;
		}

		// validate repository format
		if (!repository.includes('/')) {
			await interaction.reply({ 
				content: '❌ Invalid repository format. Please use format: owner/repo', 
				ephemeral: true 
			});
			return;
		}

		// acknowledge the interaction immediately
		await interaction.deferReply({ ephemeral: false });

		try {
			const userId = interaction.user.tag;
			const result = await handleRevertCommit(repository, commitHash, userId);
			
			await interaction.editReply(result.message);
		} catch (error) {
			console.error('❌ Error in revert command:', error);
			await interaction.editReply('❌ An error occurred while processing the revert command.');
		}
	}
}; 