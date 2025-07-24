import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuInteraction } from 'discord.js';
import { hasAdminPermissions } from '../../utils/index.js';
import revertCommand from './commands/revert.js';

// handle button interactions
export async function handleButtonInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
	const customId = interaction.customId;

	if (customId.startsWith('revert_select_')) {
		await handleRevertDropdown(interaction as StringSelectMenuInteraction);
	}
}

// handle revert dropdown interaction
async function handleRevertDropdown(interaction: StringSelectMenuInteraction): Promise<void> {
	if (!interaction.member || !hasAdminPermissions(interaction.member, interaction.client)) {
		await interaction.reply({
			content: '❌ You do not have permission to revert commits. You need either the Administrator permission or the configured admin role.',
			ephemeral: true
		});
		return;
	}

	const repoFullName = interaction.customId.replace('revert_select_', '');
	const commitHash = interaction.values[0];

	// workaround: call revertCommand.executeRevert only if interaction has expected methods
	if (typeof revertCommand.executeRevert === 'function' && 'deferReply' in interaction && 'editReply' in interaction) {
		await revertCommand.executeRevert(interaction as any, commitHash, repoFullName);
	} else {
		await interaction.reply({
			content: '❌ Unable to process revert. Please use the /revert command with both commit hash and repository.',
			ephemeral: true
		});
	}
} 