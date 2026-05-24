# 📱 LinkFlow Mobile Client

LinkFlow is a modern, high-performance, and visually premium bookmark and shared collection manager application. Built with **React Native**, **Expo Go**, and **TypeScript**, the mobile app features an adaptive HSL-based design, real-time sync with an Express/Socket.io backend, local push notifications, and automation helpers designed to wow users at first glance.

---

## ✨ Features

- **🎨 HSL-based Adaptive Premium Theme System**: Sleek and harmonic theme configurations (including vibrant dark modes, premium typography, and elegant card outlines) adapting to all iOS notch shapes and Android safe-areas.
- **📋 Smart Clipboard URL Detector**: Monitors the system clipboard on application focus. If a valid URL is detected, it renders a floating action overlay asking if you'd like to instantly save the link to one of your folders.
- **⏰ Unread Weekly Reminders & Scheduling Wizard**: Built-in compact Wheel Date/Time Picker and single-tap scheduling presets (*1 Hour, Tonight, Tomorrow, Next Week, Instant*) utilizing `expo-notifications` to help you never forget what to read.
- **🤝 Real-time Shared Collection Collaboration**: Socket.io-driven folder synchronization. Add, invite, or manage active collaborators inside folders, and watch link modifications synchronize instantly across all devices.
- **🔍 Auto-Categorization & OG Scraped Metadata**: Saves metadata previews like card images, site names, titles, descriptions, and automatically tags links into categorized folders (*Video, Article, Product, Social, Other*).
- **🚀 Modular Clean Architecture**: 100% strongly-typed component architecture ensuring zero compiler errors, clean separation of concerns, and maximum reusability.

---

## 🛠️ Tech Stack

- **Framework**: React Native with [Expo SDK 54](https://expo.dev/)
- **Navigation**: File-system based routing using [Expo Router v3](https://docs.expo.dev/router/introduction/)
- **UI & Styling**: [React Native Paper v5](https://reactnativepaper.com/) combined with a custom HSL design utility
- **Notifications**: [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) for local schedules and background alerts
- **TypeScript**: Strict type check setup (100% typed, no `any` fallbacks)
- **Sockets**: `socket.io-client` for real-time room divisions
- **HTTP Client**: `axios` for secure REST communications

---

## 📂 Project Structure

```directory
mobile/
├── .expo/               # Expo temporary build and cache files
├── app/                 # Expo Router file-system navigation
│   ├── _layout.tsx      # Entrypoint wrapper, paper theme provider, notification hooks
│   ├── index.tsx        # Core dashboard workspace, active lists, tabs, and drawer managers
│   ├── add.tsx          # Card submit overlay with scraped preview
│   └── edit/
│       └── [id].tsx     # Link editor details screen
├── components/          # Reusable UI & Dialogue overlays
│   ├── AuthScreen.tsx          # Dynamic login/register panel with adaptive transitions
│   ├── BioSettingsDialog.tsx   # Custom SSR Bio & HSL Theme selector dialog
│   ├── ClipboardPrompt.tsx     # Floating clipboard auto-URL detection panel
│   ├── CollaborationDialog.tsx # Socket-powered multi-user invite & member manager
│   ├── FolderFormDialog.tsx    # Folder creation & dynamic HSL color/icon presets
│   ├── LinkCard.tsx            # Rich media preview card with OG tags & action hooks
│   └── ReminderDialog.tsx      # Visual scheduler & smart reminder picker
├── constants/           # Global design system constants
│   └── index.ts         # Central HSL palettes, category symbols, theme tokens
├── services/            # Client WebSocket and API adapters
│   └── socket.ts        # Dynamic Socket.io connection instance
├── types/               # Centralized domain typings
│   └── index.ts         # Data models (User, Link, Folder, Reminder) and props contracts
└── utils/               # Native helpers and calculations
    ├── dateHelper.ts     # Compact custom localized relative date formatter
    └── reminderHelper.ts # expo-notifications scheduling, listing, and cancel engines
```

---

## 🚀 Getting Started & Local Setup

Follow these steps to run the LinkFlow mobile client locally on your computer or physical smartphone:

### 📋 Prerequisites

Ensure you have **Node.js (version 18 or above)** and `npm` installed on your machine.

### 📦 Installation

1. Navigate to the mobile workspace directory:
   ```bash
   cd mobile
   ```
2. Install all required Expo and React Native dependencies:
   ```bash
   npm install
   ```

### 📱 Local Execution

Run the Expo development bundler:
```bash
npx expo start
```

Once Metro is running, you can open the client in the following ways:
- **Physical Device (Recommended)**: Download the **Expo Go** app from the iOS App Store or Google Play Store. Scan the QR code displayed in your terminal.
- **iOS Simulator**: Press `i` in the terminal (Requires macOS and Xcode installed).
- **Android Emulator**: Press `a` in the terminal (Requires Android Studio with AVD setup).
- **Web App**: Press `w` to spin up a web preview.

---

## ⚙️ Environment Configuration

By default, the mobile client is configured to connect to the live production API. You can change this to target your local server during development.

Open the socket server configuration at `mobile/services/socket.ts` and REST clients in `app/index.tsx` to switch targets:

```typescript
// Production Render API Target
export const SOCKET_URL = "https://linkflow-server-uask.onrender.com";

// Local development Target (replace with your machine's local IP when using physical devices)
// export const SOCKET_URL = "http://localhost:3001"; 
```

> [!TIP]
> When testing on a **physical device** via Expo Go, replace `localhost` with your computer's local IP address (e.g., `http://192.168.1.50:3001`) so the device can reach the server.

---

## 🔔 Native Notifications Configuration

LinkFlow uses local device notifications to prompt you about saved links. 

When you boot the app, it requests push permissions automatically. You can toggle **Smart Weekly Reminders** to let the app automatically select unread links and schedule notifications, or manually choose a date/time using the wheel dialog inside `ReminderDialog`.
