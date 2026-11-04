Act as a Senior React Engineer and PWA Specialist. Build a Quran Memorization Testing web application ("اختبار حفظ القرآن الكريم") using React (Vite), TypeScript, Tailwind CSS, and standard PWA capabilities (offline-first via vite-plugin-pwa).

### Core Requirements & Architecture:

1. **Zero API Calls / Completely Offline-Ready:**
   - The app must rely 100% on local JSON data stored in `src/data/` (e.g., surahs metadata, ayaat, page mappings, juz mappings).
   - Mock/define the minimal required JSON structure and sample data for development so the code runs immediately.

2. **Scope Selection Features (نطاقات الاختبار):**
   - Allow flexible scope filtering:
     - By Surah (single or multi-select).
     - By Page Range (e.g., Pages 20–100).
     - By Juz (e.g., Juz 1, 2, 30).
     - By Predefined Presets (e.g., "المفصل" from Qaf to An-Nas).
     - By Multiple Custom Ranges simultaneously (e.g., Al-Baqarah to An-Nisa AND Al-Hajj to An-Nur AND Qaf to An-Nas).
   - Resolve all selections down to a unified, deduplicated list of available pages or ayaat.

3. **Fair Distribution Algorithm (التوزيع العادل للأسئلة):**
   - The user inputs the total desired number of questions ($N$).
   - Divide the resolved page/ayah pool into $N$ equal chunks/segments (e.g., 100 pages with 10 questions = 1 question randomly sampled from each 10-page block) to ensure full, balanced coverage across the entire selected range.

4. **Testing Interface (واجهة الاختبار):**
   - **Question Initialization:** Pick a random starting Ayah within the chosen chunk.
   - **Interactive Recitation / Verification Mode:**
     - Display the initial Ayah (or prompt the user to recite from it).
     - Provide clear controls for the examiner (المختبر):
       - "Next Ayah" (آية تالية) to reveal/verify the subsequent verse in sequence.
       - "Previous Ayah" (آية سابقة) to go back if needed.
     - Option to hide/reveal verse text (blind testing for the test-taker vs examiner view).
   - **Evaluation per Question:**
     - Once a question is concluded, allow the examiner to rate the answer (e.g., Excellent, Good, Weak, or a 1–5 star score / error tracker: Hifz mistake, Tajweed mistake).
     - "Next Question" button transitions to the next sampled segment.

5. **Test Summary & Results:**
   - At the end of the test, show a full breakdown: total score, questions reviewed, mistakes made, and surahs that need revision.

6. **UI & UX Specifications:**
   - RTL direction by default (`dir="rtl"`).
   - Clean, accessible typography using Arabic/Uthmani-friendly fonts (e.g., Amiri or Scheherazade New).
   - Simple, maintainable architecture:
     ```text
     src/
     ├── assets/
     ├── components/
     │   ├── ScopeSelector/
     │   ├── TestingView/
     │   └── ResultsView/
     ├── hooks/ (useTestEngine, useOfflineData)
     ├── utils/ (samplingAlgorithm, quranHelpers)
     ├── types/
     └── data/ (mock Quran JSON)
     ```

Generate clean, production-ready code starting with the core data types, the fair sampling algorithm (`generateQuestions`), and the main state machine for running the test.