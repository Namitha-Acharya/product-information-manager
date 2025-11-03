# Baserow Development Server Setup Guide

## Overview
This guide explains how to start the Baserow development server on your local machine.

## The Problem
The "site can't be reached" error occurs because the development server is not running. Baserow requires you to manually start the Nuxt.js development server to access the web frontend at http://localhost:3000.

## Solution: Starting the Development Server

### Option 1: Using the Startup Script (Recommended)
I've created a convenient startup script for you:

```bash
cd /Users/namithaacharya/baserow
./start-baserow-dev.sh
```

This script will:
- Navigate to the web-frontend directory
- Check and install dependencies if needed
- Start the Nuxt development server on port 3000

### Option 2: Manual Startup
If you prefer to start it manually:

```bash
cd /Users/namithaacharya/baserow/web-frontend
npm run dev
```

## Access the Application
Once the server is running, access Baserow at:
- **URL**: http://localhost:3000
- **Network URL**: http://192.168.1.188:3000 (for other devices on your network)

## Important Notes

1. **First-time Compilation**: The initial build can take 5-10 minutes. Be patient and wait for the message:
   ```
   [webpackbar] ✔ Client: Compiled successfully
   ```

2. **Server Must Stay Running**: Keep the terminal window open. Closing it will stop the server.

3. **Backend Required**: For full functionality, you also need the Baserow backend running. If you're only running the frontend, some features may not work.

4. **Port Conflicts**: If port 3000 is already in use, you'll need to either:
   - Stop the process using port 3000
   - Modify the port in the nuxt configuration

## Troubleshooting

### "Site can't be reached" error
- Make sure the dev server is running (`npm run dev`)
- Wait for compilation to complete
- Check that nothing else is using port 3000

### Compilation takes too long
- This is normal for the first run
- Subsequent starts will be faster due to caching
- The codebase is large (enterprise + premium + core modules)

### Permission errors
- Make sure the startup script is executable: `chmod +x start-baserow-dev.sh`

## Configuration
The development environment is configured via:
- `.env-e` file in the project root
- `web-frontend/config/nuxt.config.base.js`

Current configuration:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Media files: http://localhost:4000/media/
