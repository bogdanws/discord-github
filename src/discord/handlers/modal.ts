import { ModalSubmitInteraction } from 'discord.js';
import { handleRevertCommit } from '../../github/handler.js';
import { hasAdminPermissions } from '../../utils/index.js';

// handle modal submissions
export async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
	const customId = interaction.customId;

	switch (customId) {
		case 'revert_modal':
			await handleRevertModal(interaction);
			break;
		default:
			console.log(`Unknown modal customId: ${customId}`);
	}
}

// handle revert modal submission
async function handleRevertModal(interaction: ModalSubmitInteraction): Promise<void> {
	// check if user has admin permissions
	if (!interaction.member || !hasAdminPermissions(interaction.member, interaction.client)) {
		await interaction.reply({ 
			content: '❌ You do not have permission to revert commits. You need either the Administrator permission or the configured admin role.', 
			ephemeral: true 
		});
		return;
	}

	const commitHash = interaction.fields.getTextInputValue('commit_hash_input');
	const repository = interaction.fields.getTextInputValue('repository_input');

	if (!commitHash || !repository) {
		await interaction.reply({ 
			content: '❌ Both commit hash and repository are required.', 
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
	await interaction.deferReply({ ephemeral: true });

	try {
		const userId = interaction.user.tag;
		const result = await handleRevertCommit(repository, commitHash, userId);
		
		await interaction.editReply(result.message);
	} catch (error) {
		console.error('❌ Error in revert modal:', error);
		await interaction.editReply('❌ An error occurred while processing the revert command.');
	}
} 