# 🎓 Bhashiq (भाषिक): AI Live On-Call Multilingual Translator & Adaptive Gamified Learning Platform
**Academic Project Report & System Architecture Specification**

---

## 1. Abstract
Language barriers remain one of the most critical communication bottlenecks in modern cross-cultural dialogues, emergency healthcare, and global education. **Bhashiq** is an end-to-end, real-time communication and language acquisition system. Its primary contribution is a low-latency, bidirectional **Live Call Translator** enabling individuals to converse in distinct languages (e.g. Hindi and English) with real-time speech-to-text (STT), context-aware machine translation (MT), and voice-preserving text-to-speech (TTS) alongside synchronized bilingual subtitles. In addition, the platform incorporates an Augmented Reality (AR) Camera Vision Translator for physical signs and menus, an AI Context and Homonym Disambiguator, and an adaptive gamified learning engine featuring spaced-repetition flashcards, 1v1 multiplayer duels, and mistake-driven drill generation.

---

## 2. Key Modules & Functional Architecture

### 2.1 Live Call Translator (Core USP)
The centerpiece of the system operates on a dual-channel pipeline:
1. **Audio Capture & Streaming**: User vocal input is captured via HTML5 MediaStreams and processed by the client-side Web Speech recognition engine with continuous tokenization.
2. **Dynamic Language Auto-Detection**: Text and phonetic scripts are analyzed using regex and unicode classification to identify the source script (Devanagari $\rightarrow$ Hindi/Marathi, Latin $\rightarrow$ English/Spanish/French, Kana/Kanji $\rightarrow$ Japanese).
3. **Translation Engine**: Evaluates contextual idioms, queries local linguistic dictionaries, or invokes translation APIs with under 50ms processing overhead.
4. **Voice Preservation Synthesis**: Adjusts formants, pitch (0.88x male depth, 1.15x female pitch), and pacing (0.8x - 1.2x) to maintain vocal identity.
5. **Real-Time Subtitles & Session Transcript**: Simultaneous dual-language subtitle feed with full export capability (`.txt` / `.json`).

### 2.2 Computer Vision & AR Translation
- **Optical Character Recognition (OCR)**: Integrates WebAssembly-compiled Tesseract.js engine.
- **Spatial Bounding Localization**: Extracts bounding boxes $(x_0, y_0, x_1, y_1)$ for identified text regions.
- **AR Overlay**: Renders translated text directly superimposed onto physical objects (e.g., restaurant menus *"मिसळ पाव ₹120"* $\rightarrow$ *"Misal Pav ₹120"*, railway station signage *"मुंबई सेंट्रल"* $\rightarrow$ *"Mumbai Central"*).

### 2.3 Semantic Integrity & Quality Assurance
- **Back-Translation Verification**: To prevent hallucinations and semantic drift, translations undergo reverse translation:
  $$Fidelity = \frac{2 \cdot |W_{orig} \cap W_{back}|}{|W_{orig}| + |W_{back}|} \times 100\%$$
- **Homonym Disambiguation**: Detects polysemous words (e.g., *"Bank"*, *"Spring"*, *"Crane"*, *"Bat"*) and prompts the user to select the domain-specific context.
- **Idiomatic Translation Engine**: Differentiates colloquial expressions (e.g., *"What's up?"*) from literal translations (avoiding *"What is physically above?"*).

### 2.4 Pronunciation & Phonetic Assistant
Speech attempts are compared against target native phrases using normalized Levenshtein edit distance:
$$Accuracy = \left( 1 - \frac{LevenshteinDistance(S_{spoken}, S_{target})}{\max(|S_{spoken}|, |S_{target}|)} \right) \times 100\%$$
The assistant delivers real-time breakdown of matched words, missed words, and phonetic recommendations.

### 2.5 Gamification & Adaptive Learning Engine
- **XP Progression & Badges**: Users receive quantified XP rewards across translation (+15 XP), pronunciation testing (+25 XP), and 1v1 arena victories (+100 XP).
- **Streak Protection**: Daily streaks are preserved through earned freeze tokens.
- **Personal Vocabulary Bank**: Saved terms automatically transition into Leitner spaced-repetition flashcards and auto-generated quizzes.
- **Personalized Adaptive Learning**: Aggregates recurring quiz errors to detect grammatical deficiencies (e.g. *Past Tense Conjugations*, *Gender Agreements*) and auto-constructs 5-minute targeted challenges.

### 2.6 Safety & Disaster Resiliency
- **Travel Packs**: Country-pair offline phrasebooks cached locally in browser storage.
- **Emergency SOS Mode**: 1-tap distress cards with high-contrast strobe visuals and loud synthesized announcements.

---

## 3. Technology Stack & Implementation Details
- **User Interface**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Audio & Haptics**: HTML5 Web Audio API (Synthesized tone oscillators for rings, chimes, and sirens)
- **Speech API**: Web Speech API (`SpeechRecognition` & `SpeechSynthesisUtterance`)
- **Computer Vision**: Tesseract.js WebAssembly OCR
- **Real-Time Signaling**: Node.js Express + Socket.IO (Port 5001)
- **Build System**: Vite 8.3

---

## 4. Hardware & Software Requirements
- **Client**: Any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari) on Windows, macOS, Linux, Android, or iOS.
- **Hardware**: Standard microphone and webcam / rear-facing camera.
- **Backend (Optional for Multi-Device Rooms)**: Node.js v18+.
