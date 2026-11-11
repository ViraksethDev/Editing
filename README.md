# InstaEdit Studio – Web-Based Video Editor

A modern, responsive, browser-based video editing studio inspired by Instagram Edits (https://edits.instagram.com/). Built with React, TypeScript, Tailwind CSS, HTML5 Canvas, Web Audio API, and MediaRecorder.

## Features

1. **Multi-Track Timeline**:
   - Visual Tracks (Video & Image layers).
   - Text & Titles Track with custom fonts, styles, and animation presets.
   - Stickers & Overlays Track with Instagram badges (Link in Bio, New Post, Double Tap) and emojis.
   - Audio Track with synchronized playback, volume control, fade in/out, and speed adjustments.
   - Trimming with interactive handles (drag start or end edges).
   - Clip splitting (`S` key or toolbar button).
   - Clip duplication (`Ctrl + D`).
   - Clip deletion (`Del` or `Backspace`).
   - Multi-level Undo & Redo (`Ctrl + Z` and `Ctrl + Shift + Z`).

2. **Real-Time Video Preview Canvas**:
   - HTML5 Canvas high-resolution renderer with 60 FPS playback.
   - Aspect ratio switcher: 9:16 (Reels/Shorts/TikTok), 16:9 (YouTube), 1:1 (Square), 4:5 (Portrait Feed).
   - Instagram Safe Area overlay toggle (visualizes header and bottom caption safe zones).
   - 3x3 Rule-of-Thirds composition grid.
   - Direct on-canvas drag to reposition overlays, texts, and stickers.
   - Frame-by-frame transport controls (previous/next frame, jump +/- 1s, play/pause).

3. **Color Grading & Visual Effects**:
   - Instagram Filter Presets: Clarendon, Juno, Vintage, Noir B&W, Warm Sunset, Cyberpunk, Vivid Pop, Pastel Dream, Dramatic, Retro 90s.
   - Fine-tuned Color Adjustments: Brightness, Contrast, Saturation, Blur.
   - Video Transitions: Cross Dissolve, Slide Left, Slide Right, Zoom Impact, Color Wipe.

4. **Media & Asset Management**:
   - Local file upload (MP4, WebM, MOV, JPG, PNG, MP3, WAV).
   - Built-in Procedural Stock Video Generator (Golden Hour Sunset, Cyberpunk Neon City, Aesthetic Coffee, High-Energy Pulse, Emerald Forest).
   - Synthesized Royalty-Free Music & Sound Effects (Lo-fi beats, Electro groove, Ambient drones, Swoosh transitions, Pops, Chimes).
   - Timed Caption Scripts & manual subtitle injector.

5. **Real Video Export System**:
   - Browser-side rendering engine combining HTML5 Canvas video stream and Web Audio API destination stream.
   - Selectable aspect ratios (9:16, 16:9, 1:1, 4:5).
   - Resolutions: 480p, 720p, 1080p.
   - Frame rates: 24, 30, 60 FPS.
   - Output format: MP4 and WebM.
   - Real progress indicator with frame counter, stage info, cancel support, and direct file download.

6. **Local Project Persistence**:
   - IndexedDB storage for offline project persistence, clip state, and asset caching.
   - Projects dashboard to create, rename, duplicate, and delete projects.

## Project Structure

```
├── index.html
├── metadata.json
├── package.json
├── README.md
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── types/
│   │   └── editor.ts
│   ├── services/
│   │   ├── storageService.ts       # IndexedDB project and blob storage
│   │   ├── sampleMediaService.ts   # Procedural canvas videos & audio synths
│   │   ├── audioEngine.ts          # Web Audio API multi-track mixer
│   │   └── exportService.ts        # Canvas + MediaRecorder video renderer
│   ├── store/
│   │   └── editorStore.ts          # Zustand state store with undo/redo
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts # Space, S, Ctrl+Z, Ctrl+D, frame step
│   ├── utils/
│   │   └── formatTime.ts           # SMPTE timecode (MM:SS:FF)
│   └── components/
│       ├── dashboard/
│       │   └── ProjectDashboard.tsx
│       ├── layout/
│       │   ├── Topbar.tsx
│       │   ├── Sidebar.tsx
│       │   └── EditorLayout.tsx
│       ├── editor/
│       │   ├── PreviewCanvas.tsx
│       │   ├── Timeline.tsx
│       │   ├── TimelineTrack.tsx
│       │   ├── TimelineClip.tsx
│       │   └── PropertiesPanel.tsx
│       ├── media/
│       │   └── MediaLibrary.tsx
│       ├── tools/
│       │   ├── AudioEditor.tsx
│       │   ├── TextEditor.tsx
│       │   ├── CaptionsPanel.tsx
│       │   ├── StickersPanel.tsx
│       │   ├── EffectsPanel.tsx
│       │   ├── FiltersPanel.tsx
│       │   └── TransitionsPanel.tsx
│       └── modals/
│           ├── ExportModal.tsx
│           ├── SettingsModal.tsx
│           └── ShortcutsModal.tsx
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause video |
| `S` | Split selected clip at playhead |
| `Del` / `Backspace` | Delete selected clip |
| `Ctrl + D` / `Cmd + D` | Duplicate selected clip |
| `Ctrl + Z` / `Cmd + Z` | Undo last edit |
| `Ctrl + Shift + Z` / `Ctrl + Y` | Redo edit |
| `Ctrl + S` / `Cmd + S` | Save project |
| `Ctrl + E` / `Cmd + E` | Open Export modal |
| `Arrow Left` / `Arrow Right` | Step 1 frame backward / forward (1/30s) |
| `Shift + Arrow Left / Right` | Step 1 second backward / forward |
| `M` | Mute / Unmute audio |
| `Home` / `End` | Jump to start / end of timeline |

## Development & Build Commands

- **Development server**: `npm run dev` (starts on port 3000)
- **Type check & Lint**: `npm run lint`
- **Build for production**: `npm run build`

## Known Limitations & Browser Compatibility

- MediaRecorder codec support varies across browsers (Chrome supports VP9/Opus WebM and modern MP4; Safari supports MP4 H.264/AAC). The exporter automatically checks `MediaRecorder.isTypeSupported` and chooses the optimal container.
- For extremely long videos (e.g. >30 minutes), rendering directly inside browser memory can be resource intensive; shorter vertical formats (15s to 90s Reels and Shorts) render smoothly at 60 FPS.
