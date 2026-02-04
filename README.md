# MediTranslate: AI-Powered Real-Time Medical Translator

**Live Demo:** [https://medi-translate-five.vercel.app](https://medi-translate-five.vercel.app)

## 📋 Project Overview
MediTranslate is a full-stack web application designed to bridge language barriers in healthcare settings. It facilitates real-time, bidirectional communication between doctors and patients who speak different languages. 

Beyond simple translation, the application acts as an intelligent medical scribe—recording audio, maintaining conversation history, and using Generative AI to generate structured medical summaries (Symptoms, Diagnosis, Plan) automatically.

## 🚀 Features Completed
All mandatory core functionalities have been implemented:

### 1. 🗣️ Real-Time Translation
- **Bi-directional:** Supports seamless switching between "Doctor" and "Patient" roles.
- **Multi-modal:** Handles both **Text-to-Text** and **Speech-to-Text** translation.
- **Language Support:** Dynamic switching between English, Spanish, Hindi, and French.

### 2. 💬 Chat Interface
- **WhatsApp-style UI:** Clean, intuitive bubbles with distinct styling for Doctor (Blue) and Patient (White/Green).
- **Optimistic Updates:** UI updates instantly while the AI processes in the background for a responsive feel.
- **Mobile-First Design:** Fully responsive layout with a collapsible sidebar for mobile devices.

### 3. 🎙️ Audio Handling
- **Browser Recording:** Integrated MediaRecorder API for capturing audio directly from the browser.
- **Cloud Storage:** Audio clips are uploaded to **Supabase Storage** and persisted.
- **Playback:** Audio players embedded directly within the chat thread for review.

### 4. 💾 Conversation Logging & Persistence
- **Database:** All messages and metadata are stored in **Supabase (PostgreSQL)**.
- **Session Management:** Conversations persist across page reloads using LocalStorage and Database IDs.

### 5. 🔍 Smart Search
- **Full-Text Search:** Fast `ilike` queries across conversation history.
- **Context Highlighting:** Highlights search terms within the message and provides links to jump to old sessions.

### 6. 📝 AI-Powered Medical Summary
- **One-Click Reports:** Generates a professional medical summary using Google Gemini.
- **Structured Output:** Automatically categorizes the chat transcript into **Chief Complaint**, **Symptoms**, **Diagnosis**, and **Treatment Plan**.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Responsive, Mobile-First)
- **Icons:** Lucide React

### Backend & Database
- **BaaS:** Supabase (PostgreSQL Database & Object Storage)
- **API:** Next.js Server Actions / API Routes

### Artificial Intelligence
- **LLM:** Google Gemini 1.5 Flash & Gemini Pro
- **Integration:** `@google/generative-ai` SDK
- **Functionality:** - Audio Transcription (Speech-to-Text)
  - Context-aware Translation
  - Medical Summarization

---

## 🤖 AI Implementation Details
The project leverages **Google Gemini** for three distinct tasks:

1. **Translation Agent:** A dedicated prompt configures the model to act as a strict medical translator, ensuring terminology accuracy without adding conversational filler.
2. **Transcription Agent:** Handles raw audio buffers, converting speech to text while simultaneously translating it to the target language in a single pass to reduce latency.
3. **Scribe Agent:** Analyzes the full JSON transcript of the conversation to extract medical entities (Medications, Symptoms) and format them into a standard clinical SOAP note format.

---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Arpit-Rajvanshi/medi-translate.git](https://github.com/Arpit-Rajvanshi/medi-translate.git)
   cd medi-translate
   ```
2) Install Dependencies
npm install

3) Add Environment Variables

Create a file called .env.local in the root directory:

```NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```
4) Run the App Locally
```
npm run dev
```

Open:
👉 http://localhost:3000

🧠 Challenges & Learnings

Building a real-time medical translator came with unique technical challenges:

✅ Real-Time Audio Latency

Challenge: Sending raw audio files caused a 2–3 second delay.

Solution: Optimized backend to perform Transcription + Translation in one single Gemini API call, cutting processing time.

✅ Database Schema Sync

Challenge: Adding features like conversation titles caused schema mismatches with Supabase.

Solution: Implemented structured SQL migration scripts to keep Supabase schema aligned with application TypeScript types.

✅ Responsive UI

Challenge: Chat layout initially broke on mobile devices.

Solution: Adopted mobile-first UI using Tailwind md: breakpoints + collapsible sidebar hamburger menu.

⚠️ Known Limitations & Trade-offs

Audio Latency: Serverless processing adds slight delay (1–2s) compared to pure client WebSpeech API, but provides much higher translation quality and accuracy.

Browser Permissions: Mobile browsers require HTTPS to access microphone (solved by Vercel deployment).

Search Indexing: Search uses SQL ILIKE. At large scale, Postgres full-text search (tsvector) or vector embeddings will be more efficient.

🔮 Future Roadmap

Vector Search (RAG): Replace SQL search with semantic search. Example: searching "pain medicine" should return "Ibuprofen".

User Authentication: Add Supabase Auth to allow doctors to securely login and store patient history privately.

Video Integration: Add WebRTC video calls for face-to-face translation.

📄 License

This project is open-source and available under the MIT License.
