# MediTranslate: AI-Powered Real-Time Medical Translator

**Live Demo:** https://medi-translate-five.vercel.app

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
- **Full-Text Search:** fast `ilike` queries across conversation history.
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
- **LLM:** Google Gemini 2.5 Flash & Gemini Pro
- **Integration:** `@google/generative-ai` SDK
- **Functionality:** - Audio Transcription (Speech-to-Text)
  - Context-aware Translation
  - Medical Summarization

---

## 🤖 AI Implementation Details
The project leverages **Google Gemini** for three distinct tasks:

1.  **Translation Agent:** A dedicated prompt configures the model to act as a strict medical translator, ensuring terminology accuracy without adding conversational filler.
2.  **Transcription Agent:** Handles raw audio buffers, converting speech to text while simultaneously translating it to the target language in a single pass to reduce latency.
3.  **Scribe Agent:** Analyzes the full JSON transcript of the conversation to extract medical entities (Medications, Symptoms) and format them into a standard clinical SOAP note format.

---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Arpit-Rajvanshi/medi-translate.git](https://github.com/Arpit-Rajvanshi/medi-translate.git)
   cd medi-translate