# DayZ Tools Launcher

Electron desktop launcher for DayZ server workflows, local mod management, crash analysis and init generation.

## Development

Install dependencies and start the desktop app:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run dev:web
npm run build
npm run build:desktop
npm run build:desktop:dir
```

## Runtime Architecture

- Renderer: Next.js 16 App Router, exported as static assets.
- Desktop shell: Electron `main` + `preload`.
- Backend logic: `backend/node/dayz-backend.cjs`.

The previous desktop wrapper has been removed. That layer only proxied window controls, file dialogs and RPC calls into the Node backend, so the bridge now lives directly in Electron.

## Linux and Proton

DayZ, DayZ Server, DASE and DASE Tools are Windows-first binaries. On Linux, the launcher assumes they run through Proton rather than natively.

Implemented behavior:

- DayZ client auto-detection searches Steam libraries on Linux for the Windows game executable.
- DayZ Server auto-detection searches Steam libraries for `DayZServer_x64.exe` / `DayZServer.exe`.
- Client and server launches use Proton automatically on Linux.
- Client config and crash-log locations resolve through the DayZ Proton prefix instead of native Linux `Documents` / `%LOCALAPPDATA%`.
- File/folder opening uses Electron shell integration instead of Windows-only `explorer.exe`.
- Process shutdown avoids `taskkill` on Linux and terminates the tracked Proton process tree.

Optional environment overrides:

```bash
DAYZ_TOOLS_PROTON_BINARY=/path/to/proton
DAYZ_TOOLS_DAYZ_COMPAT_DATA=/path/to/steamapps/compatdata/221100
DAYZ_TOOLS_DAYZ_SERVER_COMPAT_DATA=/path/to/steamapps/compatdata/223350
```

Use these if Steam or Proton is installed in a non-standard location.

## Packaging

`npm run build:desktop` builds the exported renderer and packages Electron with `electron-builder`.

Configured targets:

- Linux: `AppImage`, `dir`
- Windows: `nsis`, `dir`
