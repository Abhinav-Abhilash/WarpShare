# WarpShare
# WarpShare ⚡

WarpShare is an open-source, local-network AirDrop and universal clipboard built for university lecture halls and study groups. 

When you need to send a 1GB PDF, a recorded lecture, or a terminal command to someone sitting next to you, sending it over Discord or WhatsApp ruins the quality, Google Drive takes too long to upload, and email limits reject it. 

WarpShare connects devices directly over the local Wi-Fi router using WebRTC. Files and text stream from screen to screen at local network speeds—with **zero cloud storage, zero internet data usage, and 100% offline capability.**

---

## 🛠️ How It Actually Works Under the Hood

We built WarpShare without external databases or third-party file APIs. Here is the actual computer science and networking logic running behind the scenes:

### 1. Zero-Copy File Chunking (Web Workers)
If you try to read a 1GB file into a web browser's main thread all at once, the DOM locks up and the page freezes. 
- We offload all file ingestion to a background **Web Worker** (`fileChunker.worker.ts`).
- The worker slices the file into **64KB chunks** (the mathematical optimal Maximum Transmission Unit for WebRTC to prevent packet fragmentation).
- It uses **Transferable Objects** (`ArrayBuffer`) to hand memory pointers from the background thread to the main thread in `0ms` without duplicating data in your system RAM.

### 2. Direct P2P Networking & Backpressure Control
Files are never uploaded to a cloud server. They stream directly from Device A's network card to Device B's network card using **WebRTC Data Channels**.
- **Buffer Backpressure:** If you are sending a massive file to an older phone with a slow Wi-Fi chip, the socket buffer can overflow. Our engine monitors `RTCDataChannel.bufferedAmount`. If the buffer crosses 1MB, it automatically pauses the Web Worker until the socket clears out, preventing browser out-of-memory crashes.
- **Signaling State Guards:** Includes defensive SDP offer/answer collision handling so duplicate network messages never trigger handshake crashes (`wrong state: stable`).
- **Screen Wake Lock API:** Automatically requests an OS screen lock during active transfers so mobile phones don't go to sleep and kill the socket mid-download.

### 3. Local Room Discovery (Server-Sent Events)
How do two laptops "find" each other without a database? 
- When you open the app, it generates a dynamic 4-digit Room PIN (e.g., `?room=8492`).
- Devices in the same room connect to a lightweight **Server-Sent Events (SSE)** stream running in Next.js local memory to swap initial WebRTC connection handshakes (ICE candidates and SDP descriptors).
- Once the direct P2P socket opens, the server signaling sleeps, and 100% of the actual file data travels locally over your Wi-Fi router.
- Includes exponential backoff auto-reconnection if your campus Wi-Fi drops.

### 4. The Knowledge Tree (No Cartoon Slop)
Instead of obnoxious pop-ups or childish gamification, we built a calm study progress tracker modeled after a **GitHub contribution heatmap**.
- Every file seeded or clipboard snippet broadcasted adds XP to your local activity log (stored cleanly in `localStorage`).
- Your visualizer grows through 6 clean vector line-art stages (from a seed dot to a pine tree canopy). Zero mobile-game bouncing physics—just clean habit tracking.

### 5. Native Offline PWA
WarpShare is built as a Progressive Web App (PWA). You can click **"Install App"** to drop it directly onto your macOS Dock, Windows Desktop, or iPhone Home Screen. Because it caches its shell locally, the app loads in `0ms` even in classroom basements with dead cell service.

---

## 💻 Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons (Strict 10px–14px rounded borders, Slate/Zinc neutral dark-mode palette)
- **Networking:** WebRTC Data Channels, Server-Sent Events (SSE)
- **Performance:** Native Web Workers, Transferable ArrayBuffers, Screen Wake Lock API
- **Storage:** Browser `localStorage`, `IndexedDB`, and automated `URL.revokeObjectURL` RAM garbage collection

---

## 🚀 Running the Project Locally

The codebase is strictly typed and compiles with zero errors (`npx tsc --noEmit`).

1. **Clone the repo:**
   ```bash
   git clone [https://github.com/yourusername/warpshare.git](https://github.com/yourusername/warpshare.git)
   cd warpshare

   ---
## ⚖️ License & Copyright

**Copyright © 2026 Abhinav-Abhilash. All rights reserved.**

This project is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**. 

What this means:
- ✔ **Free for Students & Developers:** You are free to use, modify, and study this software for educational and personal use. Tagging me will be helpful
- 🛑 **No Proprietary Theft:** If you modify this project, host it as a service, or include it in another application, you **must** open-source your entire derivative work under the exact same AGPLv3 license. 
- 💬 **Commercial Licensing:** If you wish to use WarpShare in a closed-source, proprietary, or commercial product without open-sourcing your code, you must contact the author (https://github.com/Abhinav-Abhilash) for a separate commercial license.
