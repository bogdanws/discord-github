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

		// if both parameters are provided, execute the revert directly
		if (commitHash && repository) {
			await this.executeRevert(interaction, commitHash, repository);
			return;
		}

		// if parameters are missing, show a modal for user input
		const modal = new ModalBuilder()
			.setCustomId('revert_modal')
			.setTitle('Revert Commit');

		const commitHashInput = new TextInputBuilder()
			.setCustomId('commit_hash_input')
			.setLabel('Commit Hash')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('Enter the commit hash to revert (e.g., abc1234)')
			.setRequired(true)
			.setValue(commitHash || '');

		const repositoryInput = new TextInputBuilder()
			.setCustomId('repository_input')
			.setLabel('Repository')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('Enter repository in format owner/repo')
			.setRequired(true)
			.setValue(repository || process.env.DEFAULT_REPOSITORY || '');

		const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(commitHashInput);
		const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(repositoryInput);

		modal.addComponents(firstActionRow, secondActionRow);

		await interaction.showModal(modal);
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