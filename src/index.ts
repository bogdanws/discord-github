// discord-github bot entry point
import { Client, GatewayIntentBits, Events, TextChannel, Role, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { handleButtonInteraction } from './discord/handlers/button.js';
import { handleModalSubmit } from './discord/handlers/modal.js';

// extend the Client type to include commands and custom properties
declare module 'discord.js' {
	export interface Client {
		commands: Collection<string, any>;
		commitChannel?: TextChannel;
		adminRole?: Role;
	}
}

// load environment variables
dotenv.config();

// validate required environment variables
const requiredEnvVars = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  COMMIT_CHANNEL_ID: process.env.COMMIT_CHANNEL_ID,
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,
};

// check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('💡 Please check your .env file and ensure all required variables are set');
}

// create discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // allows bot to access guild information
    GatewayIntentBits.GuildMessages,    // allows bot to read messages in guilds
    GatewayIntentBits.MessageContent,   // allows bot to read message content
    GatewayIntentBits.GuildMembers,     // allows bot to access member information
  ],
});

// create commands collection
client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	const command = await import(filePath);
	// set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command.default && 'execute' in command.default) {
		client.commands.set(command.default.data.name, command.default);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// handle bot ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ ${readyClient.user.tag} is online and ready!`);
  
  // get the specific guild
  const guild = readyClient.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
  if (!guild) {
    console.error('❌ Could not find the specified guild');
    return;
  }
  
  console.log(`🏠 Connected to guild: ${guild.name}`);
  
  // get the commit notification channel
  const channel = guild.channels.cache.get(process.env.COMMIT_CHANNEL_ID!) as TextChannel;
  if (channel) {
    client.commitChannel = channel;
    console.log(`📝 Commit channel found: #${channel.name}`);
  } else {
    console.warn('⚠️ Commit channel not found - commit notifications will be disabled');
  }
  
  // get the admin role
  const role = guild.roles.cache.get(process.env.ADMIN_ROLE_ID!);
  if (role) {
    client.adminRole = role;
    console.log(`👑 Admin role found: ${role.name}`);
  } else {
    console.warn('⚠️ Admin role not found - admin commands will only be available to server admins');
  }
  
  console.log('🚀 Bot is fully initialized and ready for GitHub integration!');
});

// handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// handle button interactions
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;

	try {
		await handleButtonInteraction(interaction);
	} catch (error) {
		console.error('❌ Error handling button interaction:', error);
		
		if (interaction.deferred) {
			await interaction.editReply({ content: 'There was an error while processing this action!' });
		} else {
			await interaction.reply({ content: 'There was an error while processing this action!', ephemeral: true });
		}
	}
});

// handle modal submissions
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isModalSubmit()) return;

	try {
		await handleModalSubmit(interaction);
	} catch (error) {
		console.error('❌ Error handling modal submission:', error);
		
		if (interaction.deferred) {
			await interaction.editReply({ content: 'There was an error while processing this action!' });
		} else {
			await interaction.reply({ content: 'There was an error while processing this action!', ephemeral: true });
		}
	}
});

// handle errors
client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

// handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  client.destroy();
  process.exit(0);
});

console.log('🚀 Starting discord-github bot...');
client.login(process.env.DISCORD_TOKEN); 