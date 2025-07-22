import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('check if bot is responsive'),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.reply('🏓 Pong!');
	},
}; 