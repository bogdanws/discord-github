import { ModalSubmitInteraction } from 'discord.js';
import { handleRevertCommit } from '../../github/handler.js';
import { hasAdminPermissions } from '../../utils/index.js';

// handle modal submissions
export async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
	const customId = interaction.customId;

	switch (customId) {
		default:
			console.log(`Unknown modal customId: ${customId}`);
	}
} 