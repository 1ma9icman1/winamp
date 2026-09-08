# RadioCore

Compact Winamp-inspired Shoutcast player with remote skins, local MP3 support, voice search, and Discord Embedded App support.

## Run locally

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

## Discord Activity setup

1. Create an application at https://discord.com/developers/applications.
2. Copy its **Application ID**.
3. Create a local `.env.local` file:

```text
VITE_DISCORD_CLIENT_ID=your_application_id
```

4. Deploy the built app at a public HTTPS URL. A temporary local option is:

```powershell
npm run dev -- --host 127.0.0.1
cloudflared tunnel --url http://127.0.0.1:5173
```

5. In the Discord Developer Portal, add the public URL under the Activity URL mapping / deployment settings.
6. Install the Activity to a test server and launch it from Discord.

The app still runs normally in a browser when no Discord client ID is configured.

## Build

```powershell
npm run build
```
