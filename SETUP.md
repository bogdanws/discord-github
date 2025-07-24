# 🤖 Discord-GitHub Bot Setup Guide

This guide will walk you through setting up your Discord-GitHub bot step by step.

## ✨ Prerequisites

- Node.js (v16 or higher)
- a Discord account
- a GitHub account
- a Discord server where you have administrator permissions

## 🛠️ Step 1: Create a Discord Bot

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

## 📝 Step 2: Get Discord IDs

You'll need to enable Developer Mode in Discord to get the required IDs:

1. Open Discord and go to User Settings → Advanced
2. Enable "Developer Mode"
3. Right-click on your server name and copy the Server ID (this is your `DISCORD_GUILD_ID`)
4. Go to Server Settings → Roles, right-click on the admin role and copy the Role ID (this is your `ADMIN_ROLE_ID`)

## 🔧 Step 3: Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Discord Bot Configuration
DISCORD_TOKEN=                # discord bot token from the developer portal
DISCORD_CLIENT_ID=            # discord application client id
DISCORD_GUILD_ID=             # discord server (guild) id where the bot will operate

# GitHub App Configuration
GITHUB_APP_ID=                # github app id from your github app settings
GITHUB_PRIVATE_KEY=           # github app private key (entire .pem contents, use literal newlines or wrap in double quotes)
GITHUB_WEBHOOK_SECRET=        # github webhook secret for verifying webhook payloads

# Bot Configuration
ADMIN_ROLE_ID=                # (optional) discord role id for admin commands
APP_URL=                      # the public-facing URL of your application (e.g., http://your-domain.com or https://your-domain.com)
PORT=3000                     # the port your application will listen on (defaults to 3000)
```

### 🏗️ Creating the GitHub App

1.  Go to **GitHub Settings** → **Developer settings** → **GitHub Apps** (https://github.com/settings/apps).
2.  Click **New GitHub App**.
3.  Fill in the following details:
    *   **App name**: a descriptive name for your app (e.g., "Discord Commit Notifier").
    *   **Homepage URL**: your bot's website or a placeholder (e.g., `https://discord.com`).
    *   **Webhook URL**: the URL where your bot will receive webhooks. This should be `APP_URL/webhooks` (replace `APP_URL` with your actual `APP_URL`).
    *   **Webhook secret**: a strong, random string to secure your webhooks.
4.  Under **Repository permissions**, grant the following permissions:
    *   **Contents**: Read & write
    *   **Metadata**: Read-only
    *   **Pull requests**: Read & write
    *   **Webhooks**: Write
5.  Under **Subscribe to events**, select the **Push** event.
6.  Click **Create GitHub App**.
7.  On the app's page, generate a new private key and open the `.pem` file in a text editor. Copy the entire contents and paste it into your `.env` file as the value for `GITHUB_PRIVATE_KEY` (use literal newlines or wrap in double quotes if needed).
8.  Install the app on the repositories you want to monitor.

## 📦 Step 4: Install Dependencies

```bash
npm install
```

## 🏃 Step 5: Build and Run the Bot

```bash
# build the TypeScript code
npm run build

# start the bot
npm start

# or run in development mode with auto-restart
npm run dev
```

## 🐳 Run with Docker

You can also run the bot using Docker or Docker Compose. This is useful for deployment or running in a containerized environment.

### 1. Build the Docker image

```bash
docker build -t discord-github-bot .
```

### 2. Run the container

Make sure you have a `.env` file in your project root with all required environment variables (see above).

```bash
docker run --env-file .env -p 3000:3000 discord-github-bot
```

### 3. Using Docker Compose

A `docker-compose.yml` file is provided for convenience. To start the bot with Docker Compose:

```bash
docker-compose up --build
```

This will build the image (if needed) and start the bot. The container will use the `.env` file for configuration.

## 🧪 Step 6: Test the Bot

Once the bot is running, you should see:
 - ✅ [Bot Name] is online and ready!
 - 🏠 Connected to guild: [Your Server Name]
 - 👑 Admin role found: [Role Name]

## 📢 Step 7: Assign Repositories to Channels

After the bot is running, you must assign your GitHub repositories to specific Discord channels for notifications.

Use the `/assign` command (admin-only) to do this:
`/assign repository:owner/repo channel:channel-name`

* if `channel-name` doesn't exist, the bot will create it for you.

### 🤖 Available Commands

- `/ping`: checks the bot's latency and responsiveness
- `/help`: displays a list of available commands
- `/status`: shows the current status and configuration of the bot
- `/revert`: (admin-only) reverts a specific commit by its hash
- `/assign <repository> <channel>`: (admin-only) assigns a repository to a specific channel for notifications. if the channel doesn't exist, it will be created.
- `/unassign`: (admin-only) unassigns a repository from a channel, stopping commit notifications.
- `/admin test-commit`: (admin-only) sends a test commit notification for `testuser/test-repo`.

## 🚀 Future Plans

- **Webhook Security**: implement webhook signature verification to secure the endpoint.
- **Enhanced Error Handling**: improve error logging and user feedback for GitHub API interactions.
- **Multi-Guild Support**: extend the bot to be configurable and operable across multiple Discord servers.
- **More Admin Tools**: add commands for more granular repository management and monitoring.

## 🆘 Troubleshooting

### bot not responding
- check that the bot token is correct
- ensure the bot has the required permissions in your server
- verify that the bot is online in your server

### missing environment variables
- make sure all required variables are set in your `.env` file
- check that there are no extra spaces or quotes around the values

### permission errors
- ensure the bot has the required permissions in your server
- check that the admin role ID is correct

### github app permission errors
If you get "Resource not accessible by integration" when assigning repositories:
1. Go to your GitHub App settings (https://github.com/settings/apps)
2. Click on your Discord bot app
3. Go to "Permissions & events"
4. Under "Repository permissions", ensure **Webhooks** is set to **Write**
5. Click "Save changes"
6. You may need to re-install the app on affected repositories

## 🆘 Support

If you encounter any issues, check the console output for error messages and ensure all environment variables are properly configured. 