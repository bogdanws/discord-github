# Discord-GitHub Bot Setup Guide

This guide will walk you through setting up your Discord-GitHub bot step by step.

## Prerequisites

- Node.js (v16 or higher)
- A Discord account
- A GitHub account
- A Discord server where you have administrator permissions

## Step 1: Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "GitHub Integration Bot")
3. Go to the "Bot" section in the left sidebar
4. Click "Add Bot" and confirm
5. Under the "Privileged Gateway Intents" section, enable:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
6. Copy the bot token (you'll need this for your `.env` file)
7. Go to the "OAuth2" → "URL Generator" section
8. Select the following scopes:
   - `bot`
   - `applications.commands`
9. Select the following bot permissions:
   - Send Messages
   - Read Message History
   - Use Slash Commands
   - Embed Links
10. Copy the generated URL and open it in a browser to invite the bot to your server

## Step 2: Get Discord IDs

You'll need to enable Developer Mode in Discord to get the required IDs:

1. Open Discord and go to User Settings → Advanced
2. Enable "Developer Mode"
3. Right-click on your server name and copy the Server ID (this is your `DISCORD_GUILD_ID`)
4. Right-click on the channel where you want commit notifications and copy the Channel ID (this is your `COMMIT_CHANNEL_ID`)
5. Go to Server Settings → Roles, right-click on the admin role and copy the Role ID (this is your `ADMIN_ROLE_ID`)

## Step 3: Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_server_id_here

# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token_here

# Bot Configuration
COMMIT_CHANNEL_ID=your_commit_channel_id_here
ADMIN_ROLE_ID=your_admin_role_id_here
```

### Getting the GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name and select the following scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
4. Copy the generated token

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Build and Run the Bot

```bash
# Build the TypeScript code
npm run build

# Start the bot
npm start

# Or run in development mode with auto-restart
npm run dev
```

## Step 6: Test the Bot

Once the bot is running, you should see:
- ✅ Bot is online and ready!
- 🏠 Connected to guild: [Your Server Name]
- 📝 Commit channel found: #[Channel Name]
- 👑 Admin role found: [Role Name]

### Available Commands

- `!ping` - Check if bot is responsive
- `!help` - Show available commands
- `!status` - Show bot configuration status
- `!admin` - Admin-only commands (requires admin role)
- `!test-commit` - Test commit notification (admin only)

## Step 7: Set Up GitHub Webhooks (Coming Soon)

The next step will be setting up GitHub webhooks to automatically send commit notifications to your Discord channel.

## Troubleshooting

### Bot Not Responding
- Check that the bot token is correct
- Ensure the bot has the required permissions in your server
- Verify that the bot is online in your server

### Missing Environment Variables
- Make sure all required variables are set in your `.env` file
- Check that there are no extra spaces or quotes around the values

### Permission Errors
- Ensure the bot has the required permissions in your server
- Check that the admin role ID is correct
- Verify that the commit channel ID is correct

## Next Steps

1. Set up GitHub webhooks for automatic commit notifications
2. Add commit revert functionality
3. Implement webhook signature validation
4. Add more admin commands and features

## Support

If you encounter any issues, check the console output for error messages and ensure all environment variables are properly configured. 