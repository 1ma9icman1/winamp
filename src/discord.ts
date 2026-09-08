import { DiscordSDK } from '@discord/embedded-app-sdk'

export type DiscordActivityStatus = 'standalone' | 'connected' | 'unavailable'

export async function initializeDiscordActivity(): Promise<DiscordActivityStatus> {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '1546720899632210045'
  const isEmbedded = window.parent !== window

  if (!isEmbedded || !clientId) return 'standalone'

  try {
    const discordSdk = new DiscordSDK(clientId)
    await discordSdk.ready()
    window.dispatchEvent(new CustomEvent('discord-activity-ready'))
    return 'connected'
  } catch (error) {
    console.warn('[RadioCore] Discord Activity SDK unavailable:', error)
    return 'unavailable'
  }
}
