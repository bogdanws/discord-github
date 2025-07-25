import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
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

		// status indicators
		const check = '✅';
		const cross = '❌';
		const formatStatus = (ok: boolean, label: string) =>
			ok ? `${check} ${label}` : `${cross} ${label}`;

		// check if all critical components are configured
		const criticalChecks = [
			!!guild,
			!!adminRole,
			!!process.env.GITHUB_APP_ID,
			!!process.env.GITHUB_PRIVATE_KEY,
			!!process.env.GITHUB_WEBHOOK_SECRET
		];
		const allHealthy = criticalChecks.every(check => check);

		// create embed
		const embed = new EmbedBuilder()
			.setTitle('🤖 Bot Status & Configuration')
			.setColor(allHealthy ? 0x00ff00 : 0xff6b00) // green if healthy, orange if issues
			.setTimestamp();

		// discord configuration
		embed.addFields({
			name: '🔧 Discord Configuration',
			value: [
				`**Guild:** ${guild?.name || `${cross} Not found`}`,
				`**Admin Role:** ${adminRole ? `${check} ${adminRole.name}` : `${cross} Not configured`}`
			].join('\n'),
			inline: false
		});

		// github configuration
		embed.addFields({
			name: '🐙 GitHub Configuration',
			value: [
				formatStatus(!!process.env.GITHUB_APP_ID, 'App ID'),
				formatStatus(!!process.env.GITHUB_PRIVATE_KEY, 'Private Key'),
				formatStatus(!!process.env.GITHUB_WEBHOOK_SECRET, 'Webhook Secret')
			].join('\n'),
			inline: true
		});

		// webhook configuration
		embed.addFields({
			name: '🌐 Webhook Configuration',
			value: formatStatus(!!process.env.APP_URL, 'Webhook URL'),
			inline: true
		});

		// repository assignments
		let repoValue = 'No repositories assigned';
		if (assignments.length > 0) {
			if (assignments.length <= 10) {
				repoValue = assignments.map(a => `• ${a.repository} → <#${a.channel_id}>`).join('\n');
			} else {
				// if too many assignments, show count and first few
				const firstFew = assignments.slice(0, 8).map(a => `• ${a.repository} → <#${a.channel_id}>`).join('\n');
				repoValue = `${firstFew}\n... and ${assignments.length - 8} more`;
			}
		}

		embed.addFields({
			name: `📚 Repository Assignments (${assignments.length})`,
			value: repoValue,
			inline: false
		});

		// add footer with additional info
		embed.setFooter({
			text: `Bot uptime: ${Math.floor(client.uptime! / 1000 / 60)} minutes`
		});

		await interaction.reply({ embeds: [embed] });
	},
};