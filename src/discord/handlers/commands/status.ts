import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getAllRepositoryAssignments } from '../../../db/database';

export default {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('show bot status and configuration'),
	async execute(interaction: ChatInputCommandInteraction) {
		// get bot instance from interaction
		const client = interaction.client;
		const guild = interaction.guild;
		
		const adminRole = client.adminRole;

		// get all repository assignments
		const assignments = await getAllRepositoryAssignments();
		let repoAssignments = 'none';
		if (assignments.length > 0) {
			repoAssignments = assignments.map(a => `• \			${a.repository} → <#${a.channel_id}>`).join('\n');
		}

		// build pretty status message
		const check = '✅';
		const cross = '❌';
		const formatStatus = (ok: boolean) => ok ? `${check}` : `${cross}`;

		const statusMessage = [
			'📊 **Bot Status:**',
			`• **guild:** ${guild?.name || `${cross} not found`}`,
			`• **admin role:** ${adminRole ? `${check} ${adminRole.name}` : `${cross} not found`}`,
			`• **github app id:** ${formatStatus(!!process.env.GITHUB_APP_ID)} configured`,
			`• **github webhook secret:** ${formatStatus(!!process.env.GITHUB_WEBHOOK_SECRET)} configured`,
			`• **github token:** ${formatStatus(!!process.env.GITHUB_TOKEN)} configured`,
			`• **webhook configured:** ${formatStatus(!!process.env.WEBHOOK_DOMAIN && !!process.env.WEBHOOK_PORT)} configured`,
			'• **repository assignments:**',
			assignments.length > 0
				? assignments.map(a => `	${a.repository} → <#${a.channel_id}>`).join('\n')
				: '\tnone'
		].join('\n');
		await interaction.reply(statusMessage);
	},
}; 