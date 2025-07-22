import { Client, GuildMember, APIInteractionGuildMember } from 'discord.js';

// helper function to check if a user has admin permissions
export function hasAdminPermissions(member: GuildMember | APIInteractionGuildMember, client: Client): boolean {
  // check if user has administrator permissions
  if ('permissions' in member && typeof member.permissions !== 'string' && member.permissions.has('Administrator')) {
    return true;
  }
  
  // check if user has the custom admin role
  if (client.adminRole && 'roles' in member && Array.isArray(member.roles) && member.roles.includes(client.adminRole.id)) {
    return true;
  }
  
  // for GuildMember type, check roles.cache
  if (client.adminRole && 'roles' in member && 'cache' in member.roles && member.roles.cache.has(client.adminRole.id)) {
    return true;
  }
  
  return false;
} 