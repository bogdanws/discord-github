# Discord-GitHub Integration Bot

A powerful Discord bot that bridges the gap between your Discord server and your GitHub repositories. Get real-time commit notifications and manage your repositories directly from Discord.

## ✨ Features

- **Commit Notifications**: Receive detailed, color-coded embed messages for every commit pushed to your repositories.
- **Interactive Revert System**: Admins can quickly revert commits using interactive buttons and confirmation modals.
- **Repository-to-Channel Assignment**: Assign different repositories to specific channels for organized notifications.
- **Permission Control**: Fine-grained control over who can use administrative commands using Discord's role and permission system.

## 🤖 Commands

- `/ping`: Checks the bot's latency and responsiveness.
- `/help`: Displays a list of available commands.
- `/status`: Shows the current status and configuration of the bot.
- `/revert`: (Admin-only) Reverts a specific commit by its hash.
- `/assign <repository> <channel>`: (Admin-only) Assigns a repository to a specific channel for notifications. If the channel doesn't exist, it will be created.
- `/unassign`: (Admin-only) Unassigns a repository from a channel, stopping commit notifications.
- `/admin test-commit`: (Admin-only) Sends a test commit notification for `testuser/test-repo`.

## 🚀 Future Plans

- **Webhook Security**: Implement webhook signature verification to secure the endpoint.
- **Enhanced Error Handling**: Improve error logging and user feedback for GitHub API interactions.
- **Multi-Guild Support**: Extend the bot to be configurable and operable across multiple Discord servers.
- **More Admin Tools**: Add commands for more granular repository management and monitoring.

## 🔧 Setup

For detailed setup instructions, please see [SETUP.md](SETUP.md).
