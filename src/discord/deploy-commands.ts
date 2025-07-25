import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

// load environment variables if not already loaded
if (!process.env.DISCORD_TOKEN) {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function deployCommands() {
  const commands = [];
  const commandsPath = join(__dirname, 'handlers/commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

  // grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);
    if ('data' in command.default && 'execute' in command.default) {
      commands.push(command.default.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  // construct and prepare an instance of the REST module
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // the put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.DISCORD_GUILD_ID!),
      { body: commands },
    ) as any[];

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // and of course, make sure you catch and log any errors!
    console.error(error);
  }
} 