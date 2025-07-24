import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuInteraction, TextChannel } from 'discord.js';
import { hasAdminPermissions } from '../../utils/index.js';
import revertCommand from './commands/revert.js';
import { unassignRepository } from '../../db/database.js';
import { deleteWebhook } from '../../github/handler.js';

// handle button interactions
export async function handleButtonInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
	const customId = interaction.customId;

	if (customId.startsWith('revert_select_')) {
		await handleRevertDropdown(interaction as StringSelectMenuInteraction);
	} else if (customId === 'unbind_select_repo') {
		await handleUnbindDropdown(interaction as StringSelectMenuInteraction);
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

// add handler for unbind select menu
async function handleUnbindDropdown(interaction: StringSelectMenuInteraction): Promise<void> {
	if (!interaction.member || !hasAdminPermissions(interaction.member, interaction.client)) {
		await interaction.reply({
			content: '❌ You do not have permission to unbind repositories. You need either the Administrator permission or the configured admin role.',
			ephemeral: true
		});
		return;
	}

	const repository = interaction.values[0];
	try {
		await deleteWebhook(repository);
		await unassignRepository(repository);
		// send ephemeral confirmation to the user
		await interaction.reply({
			content: `✅ Successfully unbound repository \`${repository}\` from notifications.`,
			ephemeral: true
		});
		// send a public message in the channel
		const userMention = `<@${interaction.user.id}>`;
		if (interaction.channel && interaction.channel instanceof TextChannel) {
			await interaction.channel.send({
				content: `🔄 Repository \`${repository}\` was unbound from notifications by ${userMention}.`
			});
		}
	} catch (error) {
		console.error('❌ Error unbinding repository:', error);
		await interaction.reply({
			content: '❌ An error occurred while unbinding the repository.',
			ephemeral: true
		});
	}
} 