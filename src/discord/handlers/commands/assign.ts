import { SlashCommandBuilder, CommandInteraction, ChannelType, TextChannel, ChatInputCommandInteraction } from 'discord.js';
import { assignRepository } from '../../../db/database';
import { hasAdminPermissions } from '../../../utils';

export default {
  data: new SlashCommandBuilder()
    .setName('assign')
    .setDescription('Assign a GitHub repository to a Discord channel for commit notifications.')
    .addStringOption(option =>
      option.setName('repository')
        .setDescription('The name of the GitHub repository (e.g., "owner/repo").')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('channel')
        .setDescription('The name of the Discord channel to send notifications to.')
        .setRequired(true)),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild || !interaction.member || !hasAdminPermissions(interaction.member, interaction.client)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const repository = interaction.options.getString('repository', true);
    const channelName = interaction.options.getString('channel', true);

    try {
      await interaction.deferReply({ ephemeral: true });

      let channel = interaction.guild.channels.cache.find(
        ch => ch.name === channelName && ch.type === ChannelType.GuildText
      ) as TextChannel;

      if (!channel) {
        channel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: ['SendMessages'],
            },
            {
              id: interaction.client.user.id,
              allow: ['SendMessages', 'EmbedLinks'],
            },
          ],
        });
      }

      await assignRepository(repository, channel.id);

      await interaction.editReply(`Successfully assigned repository \`${repository}\` to channel \`#${channel.name}\`.`);
    } catch (error) {
      console.error('Error assigning repository:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply('An error occurred while assigning the repository.');
      } else {
        await interaction.reply({ content: 'An error occurred while assigning the repository.', ephemeral: true });
      }
    }
  },
};