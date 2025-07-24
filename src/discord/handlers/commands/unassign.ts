import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, StringSelectMenuInteraction } from 'discord.js';
import { getAllRepositoryAssignments, unassignRepository } from '../../../db/database';
import { hasAdminPermissions } from '../../../utils';

const UNBIND_SELECT_ID = 'unbind_select_repo';

export default {
  data: new SlashCommandBuilder()
    .setName('unassign')
    .setDescription('Unassign a GitHub repository from a channel.'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member || !hasAdminPermissions(interaction.member, interaction.client)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const assignments = await getAllRepositoryAssignments();
    if (assignments.length === 0) {
      return interaction.reply({
        content: 'No repositories are currently assigned to any channel.',
        ephemeral: true,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(UNBIND_SELECT_ID)
      .setPlaceholder('Select a repository to unbind')
      .addOptions(assignments.map(a =>
        new StringSelectMenuOptionBuilder()
          .setLabel(a.repository)
          .setDescription(`Unbind from <#${a.channel_id}>`)
          .setValue(a.repository)
      ));

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: 'Select a repository to unbind:',
      components: [row],
      ephemeral: true,
    });
  },
}; 