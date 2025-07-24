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
4. Go to Server Settings → Roles, right-click on the admin role and copy the Role ID (this is your `ADMIN_ROLE_ID`)

## Step 3: Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_server_id_here

# GitHub App Configuration
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
WEBHOOK_DOMAIN=your-server-ip:3000

# Bot Configuration
ADMIN_ROLE_ID=your_admin_role_id_here
```

### Creating the GitHub App

1.  Go to **GitHub Settings** → **Developer settings** → **GitHub Apps** (https://github.com/settings/apps).
2.  Click **New GitHub App**.
3.  Fill in the following details:
    *   **App name**: A descriptive name for your app (e.g., "Discord Commit Notifier").
    *   **Homepage URL**: Your bot's website or a placeholder (e.g., `https://discord.com`).
    *   **Webhook URL**: The URL where your bot will receive webhooks. This should be `http://your-server-ip:3000/webhooks`.
    *   **Webhook secret**: A strong, random string to secure your webhooks.
4.  Under **Repository permissions**, grant the following permissions:
    *   **Contents**: Read & write
    *   **Metadata**: Read-only
    *   **Pull requests**: Read & write
    *   **Webhooks**: Write
5.  Under **Subscribe to events**, select the **Push** event.
6.  Click **Create GitHub App**.
7.  On the app's page, generate a new private key and open the `.pem` file in a text editor. Copy the entire contents and paste it into your `.env` file as the value for `GITHUB_PRIVATE_KEY` (use literal newlines or wrap in double quotes if needed).
8.  Install the app on the repositories you want to monitor.

### Additional Environment Variables

After creating your GitHub App, add the `WEBHOOK_DOMAIN` environment variable to your `.env` file:

```env
WEBHOOK_DOMAIN=your-server-ip:3000
```

This should be the public URL where your bot is running (without `http://`). For local development, you can use `localhost:3000`, but for production you'll need your server's public IP or domain.

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
 - ✅ [Bot Name] is online and ready!
 - 🏠 Connected to guild: [Your Server Name]
 - 👑 Admin role found: [Role Name]
 
 ## Step 7: Assign Repositories to Channels
 
 After the bot is running, you must assign your GitHub repositories to specific Discord channels for notifications.
 
 Use the `/assign` command (admin-only) to do this:
 `/assign repository:owner/repo channel:channel-name`
 
 * If `channel-name` doesn't exist, the bot will create it for you.
 
 ### Available Commands
 
 - `/ping`: Check if bot is responsive
 - `/help`: Show available commands
 - `/status`: Show bot configuration status
 - `/revert`: Revert a specific commit
 - `/assign`: Assign a repository to a channel
 - `/admin`: Admin-only commands (e.g., test notifications)

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

### GitHub App Permission Errors
If you get "Resource not accessible by integration" when assigning repositories:
1. Go to your GitHub App settings (https://github.com/settings/apps)
2. Click on your Discord bot app
3. Go to "Permissions & events"
4. Under "Repository permissions", ensure **Webhooks** is set to **Write**
5. Click "Save changes"
6. You may need to re-install the app on affected repositories

## Support

If you encounter any issues, check the console output for error messages and ensure all environment variables are properly configured. 