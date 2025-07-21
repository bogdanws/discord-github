import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('show bot status and configuration'),
	async execute(interaction: ChatInputCommandInteraction) {
		// get bot instance from interaction
		const client = interaction.client;
		const guild = interaction.guild;
		
		// get stored channels and roles from client
		const commitChannel = client.commitChannel;
		const adminRole = client.adminRole;
		
		const statusMessage = [
			'📊 **Bot Status:**',
			`• Guild: ${guild?.name || 'Unknown'}`,
			`• Commit Channel: ${commitChannel ? `#${commitChannel.name}` : '❌ Not found'}`,
			`• Admin Role: ${adminRole ? adminRole.name : '❌ Not found'}`,
			`• GitHub Token: ${process.env.GITHUB_TOKEN ? '✅ Configured' : '❌ Not configured'}`,
		].join('\n');
		await interaction.reply(statusMessage);
	},
}; 