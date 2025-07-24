import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('show available commands'),
	async execute(interaction: ChatInputCommandInteraction) {
		const helpMessage = [
			'🤖 **Available Commands:**',
			'• `/ping` - check if bot is responsive',
			'• `/help` - show this help message',
			'• `/status` - show bot status and configuration',
			'• `/admin` - admin-only commands',
			'• `/revert` - revert a specific commit (admin only)',
			'• `/assign` - assign a GitHub repository to a Discord channel (admin only)',
			'• `/unbind` - unbind a GitHub repository from commit notifications (admin only)',
		].join('\n');
		await interaction.reply(helpMessage);
	},
}; 