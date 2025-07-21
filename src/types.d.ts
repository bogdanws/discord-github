import { Client, TextChannel, Role } from 'discord.js';

declare module 'discord.js' {
  interface Client {
    commitChannel?: TextChannel;
    adminRole?: Role;
  }
} 