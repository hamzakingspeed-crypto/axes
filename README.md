# Axes

Axes is a desktop AI companion inspired by a calm, capable Jarvis-style operator. It runs locally, supports natural speech, uses OpenAI Realtime voice with tool calling, and keeps a simple companion window plus an expandable artifact panel for notes, web results, database records, code snippets, and task status.

## Features

- Display mode by default
- Computer-use mode when explicitly requested
- OpenAI GPT Realtime voice conversations
- Voice interruption and follow-up support while tools keep working in background
- Orb-shaped animated companion UI
- Artifact panel with task updates, notes, search results, charts, tables, and snippets
- Confirmation gate for risky actions
- Built-in tool layer for search, images, notes, DB records, drafting, and workflow actions

## Tech stack

- Electron + React + TypeScript
- Vite for the renderer
- Express backend for API and local tools
- OpenAI Realtime + GPT Realtime 2 for voice and agent behavior
- SQLite for local notes and record storage

## Setup

1. Clone the repo.
2. Copy `.env.example` to `.env` and fill in your values.
3. Use your OpenAI key as:
   ```bash
   OPENAI_API_KEY=your_key_here
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the app in dev mode:
   ```bash
   npm run dev
   ```

## Run locally

- Development:
  ```bash
  npm run dev
  ```
- Production renderer build:
  ```bash
  npm run build
  ```
- Start desktop app using production config:
  ```bash
  npm start
  ```

## Security and approvals

- Keys stay in a local `.env` file and are never printed in logs.
- Computer-use actions that are risky require confirmation before they run.
- The app pauses for tasks like sending messages, deleting data, buying, changing account settings, or sharing private info.

## Project structure

- `src/` — renderer UI and frontend logic
- `server/` — local backend and tool orchestration
- `electron/` — Electron shell
- `.env` — local secret storage

## Quick test checklist

1. Launch the desktop app.
2. Confirm the default display mode loads.
3. Start a voice session and ask a simple question.
4. Interrupt Axes mid-response and ask a follow-up.
5. Ask it to search the web, create a note, or draft a message.
6. Switch to computer-use mode and ask it to open an app or inspect an active window.
7. Use the artifact panel to inspect notes, search output, code snippets, and task progress.
8. Trigger a risky action and confirm the approval gate appears.

## Notes

This app is designed as a strong local prototype. The actual voice and tool execution will use your OpenAI key and local environment configuration. Keep `.env` outside of version control.
