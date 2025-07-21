import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { hasAdminPermissions } from './utils.js';

// handle button interactions
export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
	const customId = interaction.customId;

	if (customId.startsWith('revert_prompt_')) {
		await handleRevertButton(interaction);
	}
}

// handle revert button - show modal with pre-filled values
async function handleRevertButton(interaction: ButtonInteraction): Promise<void> {
	// check if user has admin permissions
	if (!interaction.member || !hasAdminPermissions(interaction.member, interaction.client)) {
		await interaction.reply({ 
			content: '❌ You do not have permission to revert commits. You need either the Administrator permission or the configured admin role.', 
			ephemeral: true 
		});
		return;
	}

	// parse custom id: revert_prompt_owner/repo_commitId
	const parts = interaction.customId.split('_');
	if (parts.length !== 4) {
		await interaction.reply({ 
			content: '❌ Invalid button configuration.', 
			ephemeral: true 
		});
		return;
	}

	const repositoryFullName = parts[2];
	const commitId = parts[3];

	// show modal with pre-filled values
	const modal = new ModalBuilder()
		.setCustomId('revert_modal')
		.setTitle('Revert Commit');

	const commitHashInput = new TextInputBuilder()
		.setCustomId('commit_hash_input')
		.setLabel('Commit Hash')
		.setStyle(TextInputStyle.Short)
		.setPlaceholder('Enter the commit hash to revert')
		.setRequired(true)
		.setValue(commitId);

	const repositoryInput = new TextInputBuilder()
		.setCustomId('repository_input')
		.setLabel('Repository')
		.setStyle(TextInputStyle.Short)
		.setPlaceholder('Enter repository in format owner/repo')
		.setRequired(true)
		.setValue(repositoryFullName);

	const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(commitHashInput);
	const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(repositoryInput);

	modal.addComponents(firstActionRow, secondActionRow);

	await interaction.showModal(modal);
} 