# QR Asset Scanner — Setup Guide

## Prerequisites

- Node.js 18+ installed
- iPhone or Android phone
- Install **Expo Go** from the App Store / Play Store

## Getting Started

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd QR_Asset_Scanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in the Supabase credentials (ask the project lead for these).

4. **Start the dev server**
   ```bash
   npx expo start --tunnel
   ```
   This will show a QR code in your terminal.

5. **Open on your phone**
   - Open **Expo Go** on your phone
   - Scan the QR code from step 4
   - The app will download and open

## Login

Use the credentials provided to you. Your account role determines which screens you see:

- **Field Worker** — Scan, Inventory, Activity tabs
- **Office Staff** — Dashboard, Materials, Exceptions, Locations, QR Codes, Reports tabs

## Troubleshooting

- **"Network request failed"** — Make sure your `.env` file has the correct Supabase URL and key. Force-close Expo Go and restart.
- **App not updating** — Stop the dev server, run `npx expo start --tunnel --clear` to clear the cache.
- **Camera not working** — QR scanning requires a real device (not simulator). Make sure you granted camera permission.

## Notes

- QR scanning requires a physical device with a camera
- The app works offline — actions are queued and sync when you reconnect
- When offline, a yellow banner appears at the top of the screen
