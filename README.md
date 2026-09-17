# 📱 LinkFlow Mobile Client

LinkFlow is a modern, high-performance, and visually premium bookmark and shared collection manager application. Built with **React Native**, **Expo Go**, and **TypeScript**, the mobile app features an adaptive HSL-based design, real-time sync with an Express/Socket.io backend, local push notifications, and automation helpers designed to wow users at first glance.

---

## 🚀 Live Demo

| | |
| :--- | :--- |
| 🌐 **Web / PWA** | [linkflow.expo.app](https://linkflow.expo.app) *(installable on iOS/Android via "Add to Home Screen")* |
| 🪪 **Public bio page (SSR)** | [linkflow-server-uask.onrender.com/bio/demo](https://linkflow-server-uask.onrender.com/bio/demo) |
| ⚙️ **Backend repo** | [miracerdin1/linkflow-server](https://github.com/miracerdin1/linkflow-server) |

**Demo account** — no sign-up needed:

```
email:    demo@linkflow.app
password: demo1234
```
<!-- TODO: bu hesabı sunucuda oluştur ve içine birkaç klasör/link ekle -->

> [!NOTE]
> The API runs on Render's free tier, so the **first request after idle can take 30–60 seconds** while the server wakes up. Subsequent requests are instant.

Prefer to run it yourself? Jump to [Getting Started](#-getting-started--local-setup) — the client points at the production API out of the box, so no backend setup is required.

---

## 📸 Screenshots

<!-- TODO: docs/screenshots/ klasörüne görselleri koy (dashboard.png, link-card.png, reminder.png, archive-map.gif) -->
| Dashboard | Link card | Reminder wizard | 3D archive map |
| :---: | :---: | :---: | :---: |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Link card](docs/screenshots/link-card.png) | ![Reminder](docs/screenshots/reminder.png) | ![Archive map](docs/screenshots/archive-map.gif) |

---

## ✨ Features

- **🎨 HSL-based Adaptive Premium Theme System**: Sleek and harmonic theme configurations (including vibrant dark modes, premium typography, and elegant card outlines) adapting to all iOS notch shapes and Android safe-areas.
- **📋 Smart Clipboard URL Detector**: Monitors the system clipboard on application focus. If a valid URL is detected, it renders a floating action overlay asking if you'd like to instantly save the link to one of your folders.
- **⏰ Unread Weekly Reminders & Scheduling Wizard**: Built-in compact Wheel Date/Time Picker and single-tap scheduling presets (*1 Hour, Tonight, Tomorrow, Next Week, Instant*) utilizing `expo-notifications` to help you never forget what to read.
- **🤝 Real-time Shared Collection Collaboration**: Socket.io-driven folder synchronization. Add, invite, or manage active collaborators inside folders, and watch link modifications synchronize instantly across all devices.
- **🔍 Auto-Categorization & OG Scraped Metadata**: Saves metadata previews like card images, site names, titles, descriptions, and automatically tags links into categorized folders (*Video, Article, Product, Social, Other*).
- **📚 3D Library**: The archive as a physical bookshelf — one shelf per category (Video, Makale, Ürün, Sosyal, Diğer — in the order you set), one book per link with its preview image on the cover. Pan along the shelves, tap a book to pull it out, tap again to open it. The scene sits on a GPU ink-on-paper backdrop that ripples under your finger. Lazy-loaded so `three` only ships when the library is opened; respects reduced-motion.
- **🚀 Modular Clean Architecture**: 100% strongly-typed component architecture ensuring zero compiler errors, clean separation of concerns, and maximum reusability.

---

## 🛠️ Tech Stack

- **Framework**: React Native with [Expo SDK 54](https://expo.dev/)
- **Navigation**: File-system based routing using [Expo Router v3](https://docs.expo.dev/router/introduction/)
- **UI & Styling**: [React Native Paper v5](https://reactnativepaper.com/) combined with a custom HSL design utility
- **Notifications**: [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) for local schedules and background alerts
- **TypeScript**: Strict type check setup (100% typed, no `any` fallbacks)
- **3D**: `three` + `@react-three/fiber` on `expo-gl` (native) / WebGL (PWA) for the 3D library
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

All runtime settings are read from `EXPO_PUBLIC_*` environment variables in [`constants/Config.ts`](constants/Config.ts). **If no `.env` file exists, the client falls back to the live production API**, so you can run the app without any configuration.

To point the client at a local server instead, copy the example file and edit it:

```bash
cp .env.example .env
```

```env
# API + Socket.io target (both use the same URL)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Optional — only needed for in-app purchases
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | `https://linkflow-server-uask.onrender.com` | Base URL for REST (`axios`) and Socket.io |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | *(empty)* | RevenueCat public key for iOS |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | *(empty)* | RevenueCat public key for Android |
| `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` | `pro` | Entitlement that unlocks Pro features |

Which host to use for `EXPO_PUBLIC_API_URL` depends on where the app runs:

| Target | Value |
| :--- | :--- |
| Web / iOS Simulator | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| Physical device (Expo Go) | `http://<your-computer-LAN-IP>:3000`, e.g. `http://192.168.1.50:3000` |

The port must match the server's `PORT` (default `3000`).

> [!IMPORTANT]
> Metro caches env values. After changing `.env`, restart with `npx expo start --clear` — otherwise the old URL is bundled.

---

## 🔔 Native Notifications Configuration

LinkFlow uses local device notifications to prompt you about saved links. 

When you boot the app, it requests push permissions automatically. You can toggle **Smart Weekly Reminders** to let the app automatically select unread links and schedule notifications, or manually choose a date/time using the wheel dialog inside `ReminderDialog`.
