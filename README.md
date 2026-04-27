## Nightfall - AI Bedtime Stories

Nightfall is a fully client-side, serverless Progressive Web App (PWA) that generates and reads infinite, soothing bedtime stories for adults.

Powered by the Google Gemini API, the Web Speech API, and the Web Audio API, Nightfall crafts lengthy, calming narratives and pairs them with dynamically generated ambient background sounds to help you drift away to sleep.

✨ **Features**
 - Generative AI Narratives: Uses the Gemini API (targeting gemini-1.5-flash or gemini-2.5-flash for high-token output) to write 45+ minute immersive, slow-paced bedtime stories based on relaxing themes.
 - Native Text-to-Speech (TTS): Uses the browser's built-in window.speechSynthesis API to read stories aloud. Includes a custom chunking algorithm to bypass mobile browser text limits and ensure continuous playback.
 - Procedural Ambient Audio: Generates relaxing background noise (Deep River, Gentle Rain, Ocean Waves, and Campfire Crackle) entirely through code using the Web Audio API (Oscillators, Biquad Filters, and noise buffers)—no external MP3s required!
 - Zero-Backend Architecture: Everything runs entirely in the browser.
 - Secure Key Storage: Your Gemini API key is stored locally on your device via localStorage and never touches a third-party server.
 - Installable PWA: Fully offline-capable UI. Install it directly to your iOS or Android home screen for a native app experience.

🛠️ **Technology Stack**
 - Frontend UI: Vanilla HTML, JavaScript, and Tailwind CSS (via CDN)
 - Icons: Phosphor Icons
 - Typography: Lora (Serif) & Plus Jakarta Sans (Sans-Serif) via Google Fonts
 - AI Integration: Google Gemini REST API (v1beta)
 - Browser APIs: - Web Speech API
 - Web Audio API
 - Service Workers & Web App Manifest

🚀 **Deployment & Setup**
Because Nightfall is 100% client-side, deploying it is incredibly simple. It requires no build steps or Node.js backend.

1. Local Development
Clone the repository:
```
git clone [https://github.com/yourusername/nightfall.git](https://github.com/yourusername/nightfall.git)
```

Serve the directory using any local web server (e.g., VS Code Live Server or Python's HTTP server):
```
python3 -m http.server 8000
```

(Note: The Web Speech API and Service Workers require a secure context. Use localhost or an HTTPS connection).

2. Vercel / Netlify / GitHub Pages
Simply connect your GitHub repository to Vercel, Netlify, or GitHub Pages.

Build Command: (Leave blank)

Output Directory: (Leave blank or set to root /)


⚙️ **How to Use**
 - Open the app in your browser or install it to your home screen.
 - Tap the Settings (slider) icon in the top right.
 - Paste your Google Gemini API Key. (You can get a free one from Google AI Studio).
 - Choose your preferred Narrator Voice and Ambient Background sound.
 - Select a story theme from the main menu and tap Write My Story.

📱 **Mobile Browser Nuances Handled**
This app includes specific workarounds for notoriously strict mobile browser policies:
 - TTS Wake-up Lock: Bypasses Android's requirement that speech must be triggered immediately upon user interaction by separating the generation phase from the playback phase.

 - Infinite Reading Bug: Mobile Chrome crashes when passed massive blocks of text. Nightfall features a "Smart Chunking" regex engine that safely feeds the text to the TTS engine one sentence at a time.

 - Audio Context Suspension: The Web Audio API synthesizer properly suspends and resumes its context based on play/pause states to preserve mobile battery life.

📜 **License**
This project is licensed under the MIT License - see the LICENSE file for details.
