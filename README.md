# 🌐 Bhashiq (भाषिक) — AI On-Call Live Translator & Language Learning Platform

> *"Break the language barrier — in calls, conversations, images, and everyday life."*

Bhashiq is a full-stack, AI-powered real-time communication platform designed as a college mini-project. It fulfills all 21 specifications defined in the project blueprint:

---

## 🚀 Key Modules & Architecture

### Pillar 1: Real-Time Voice Calls (The USP / Centrepiece)
1. **Live Call Translator**:
   - Bi-directional speech translation: Person A speaks Hindi $\rightarrow$ Speech recognition $\rightarrow$ Hindi-to-English translation $\rightarrow$ Text-to-speech $\rightarrow$ Person B hears English (and vice versa).
   - Supports both **Simulated AI Callers** (Rahul 🇮🇳, Sofia 🇪🇸, Kenji 🇯🇵, Ananya 🇮🇳) and **Multi-Device Peer Call Rooms** via WebRTC / Socket.IO signaling.
   - Real-time live subtitles stream with original and translated text side-by-side.
2. **Language Auto-Detection**:
   - Automatically determines whether incoming speech/text is Hindi, Marathi, Spanish, English, French, Japanese, etc.
3. **Voice-Preservation Mode**:
   - Preserves gender vocal profile (male/female pitch modification), speaking speed (0.8x to 1.2x), and emotional tone presets.
4. **Live Conversation Mode (Face-to-Face Interpreter)**:
   - Split-screen two-person tabletop interpreter with dual push-to-talk triggers.
5. **Multi-Speaker Identification**:
   - Distinguishes concurrent conversation streams from multiple speakers (e.g. Speaker 1: Hindi, Speaker 2: Marathi, Speaker 3: English).
6. **Standalone Speech Translator**:
   - Fast one-tap voice input with Copy, Listen, Share, and Save actions.

---

### Pillar 2: Camera, Poster, AR & Document Vision
7. **Camera & AR Vision Translator**:
   - Live camera stream and photo capture using HTML5 MediaDevices.
   - Built-in **Tesseract.js OCR** and preset demo gallery (Mumbai Central Railway Signboard, Maharashtrian Restaurant Menu, Spanish Cafe poster).
   - **AR-Style Spatial Overlay**: Renders translated text bounding boxes approximately where the original text was.
8. **Document Translator**:
   - Upload PDF, JPG, PNG, DOCX, or TXT.
   - Extracts content, translates, and presents a side-by-side structured layout with file download.

---

### Pillar 3: Smart AI Linguistic Tools
9. **Context-Aware Text Translator**:
   - Disambiguates homonyms (e.g. *"Bank"* $\rightarrow$ Financial institution vs. River bank; *"Spring"* $\rightarrow$ Season vs. Coil vs. Water source).
10. **AI Context & Idiom Translator**:
    - Identifies idioms and colloquialisms (e.g. *"What's up?"* $\rightarrow$ "How are you?" rather than literal "What is above?").
11. **Back-Translation Verification**:
    - Round-trip semantic verification (Original $\rightarrow$ Translated $\rightarrow$ Back to Original) with fidelity score percentage.
12. **Pronunciation Assistant AI**:
    - Native phonetic breakdown (e.g. *Bonjour* $\rightarrow$ `bon-zhoor`).
    - Speech analysis calculating pronunciation accuracy score (%), matched words, missed words, and suggestions.

---

### Pillar 4: Gamified Language Learning & Safety Toolkit
13. **Language Learning Dashboard**:
    - Tracks target language progress (80%), vocabulary bank count, day streak, and total XP.
14. **Gamification & Badges**:
    - XP reward system (+10 XP translation, +15 XP words, +25 XP pronunciation, +100 XP 1v1 duel).
    - Unlocked badges (*First Words*, *100 Words Learned*, *Speaking Star*, *Polyglot*, *7-Day Streak*, *Vocabulary Master*) with confetti animations.
15. **Interactive Mini-Games**:
    - **Word Match**: Pair vocabulary terms across languages.
    - **Listening Challenge**: Hear audio clips and select the correct translation.
    - **Translation Quiz**: Speed multiple-choice test.
    - **Speaking Challenge**: Voice-activated situational prompt missions.
16. **1v1 Multiplayer Language Arena**:
    - Fast-paced 10-question duel with live scoring and +100 XP reward.
17. **Language Buddy (Tandem Exchange)**:
    - Bilingual conversation partner mode where messages are automatically mirrored and cross-translated.
18. **Personal Vocabulary Bank**:
    - One-click "Save Word" with flashcard flip review and auto-generated revision quizzes.
19. **AI Language Tutor**:
    - Conversational tutor providing feedback on Grammar, Vocabulary, Sentence Structure, and Pronunciation.
20. **Personalized Adaptive Learning**:
    - Detects frequent mistake patterns (e.g. *Weak area: Past Tense*) and generates 5-minute targeted drills.
21. **Travel Mode & Emergency SOS**:
    - Country-to-country offline travel packs (Taxi, Food, Hotel, Transport, Shopping).
    - Instant one-tap SOS Emergency mode with high-contrast distress screen and loud audio broadcast.
22. **Language Analytics Dashboard & Multi-Language UI (i18n)**:
    - Weekly usage reports and whole-app interface localization across English, Hindi (हिंदी), Marathi (मराठी), Spanish (Español), French (Français), and Japanese (日本語).

---

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Speech Engine**: Web Speech API (`SpeechRecognition`, `SpeechSynthesisUtterance`)
- **Computer Vision & OCR**: Tesseract.js Client-Side OCR & HTML5 Canvas Spatial Mapping
- **Real-Time Signaling Server**: Node.js, Express, Socket.IO
- **Tooling**: Vite 8.3

---

## 🏃 Running the Application

### 1. Start the Frontend Development Server:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 2. Start the Real-Time Calling Server (for multi-device testing):
```bash
npm run server
```
Server runs on **[http://localhost:5001](http://localhost:5001)**.
