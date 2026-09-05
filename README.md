# 🛡️ Sentinel — AI Incident Commander

> **EchoSphere: Agora Conversational AI Hackathon 2026**  
> *Autonomous Incident Bridge Voice Intelligence & Truth Engine*

---

## 1. Executive Summary

During critical production outages (SEV-1 / SEV-0), engineering response teams assemble on a live voice bridge. Communication is rapid, fragmented, and noisy. Critical operational details are lost: facts blur with assumptions, contradictory statements go unnoticed, and risky changes get deployed without proper oversight.

**Sentinel** is an autonomous AI Incident Commander that joins live incident voice conversations via **Agora Conversational AI & Real-Time Communication (RTC)**. As engineers speak, Sentinel:
1. **Transcribes live speech** into real-time conversation turns.
2. **Extracts confirmed facts** backed by telemetry and direct observations.
3. **Isolates hypotheses** and distinguishes assumptions from verified reality.
4. **Surfaces conflicting statements** (e.g. SRE reports payment latency while DevOps reports DB health is normal).
5. **Tracks action items and owners**, identifying high-risk production actions.
6. **Enforces Human-in-the-Loop approval** before dangerous actions (e.g. production rollbacks or restarts) can proceed.
7. **Maintains a unified chronological incident timeline** and generates automated postmortems.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Incident Response Team                      │
│            (Incident Commander, SRE, DevOps)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Live Microphone Audio (WebRTC)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      AGORA PLATFORM                         │
│  ┌─────────────────────────┐   ┌──────────────────────────┐ │
│  │   Agora RTC Engine      │   │  Agora Conversational AI │ │
│  │  (Real-Time Voice Mesh) │   │  - Deepgram Nova-3 STT   │ │
│  │  - Low Latency Audio    │   │  - GPT-4o-mini Reasoning │ │
│  │  - RTM Signaling/Events │   │  - MiniMax TTS Synthesis │ │
│  └────────────┬────────────┘   └────────────┬─────────────┘ │
└───────────────┼─────────────────────────────┼───────────────┘
                │ Raw Audio                   │ Real-Time Transcripts
                └──────────────┬──────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               SENTINEL INGESTION & API GATEWAY              │
│       POST /api/transcript  •  POST /api/v1/.../events       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Structured Transcript Turns
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SENTINEL TRUTH ENGINE                    │
│  ┌────────────────────────┐    ┌──────────────────────────┐ │
│  │ Fact Verification      │    │ Discrepancy & Conflict   │ │
│  │ - Telemetry correlation│    │ - Contradiction Detector │ │
│  ├────────────────────────┤    ├──────────────────────────┤ │
│  │ Hypothesis Tracker     │    │ Information Gap Analysis │ │
│  │ - Required evidence    │    │ - Unknown parameters     │ │
│  ├────────────────────────┤    ├──────────────────────────┤ │
│  │ Action Ownership       │    │ Human-in-the-Loop Gate   │ │
│  │ - Explicit assignment  │    │ - Approval state machine │ │
│  └────────────────────────┘    └──────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │ Real-Time State Mutation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                LIVE INCIDENT STATE MACHINE                  │
│       Versioned State • Facts • Hypotheses • Timeline        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Reactive Polling & SSE
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           OPERATOR CONSOLE & INCIDENT DASHBOARD             │
│  ┌────────────────────────┐    ┌──────────────────────────┐ │
│  │ Live Agora Bridge Room │    │ Structured Intelligence  │ │
│  │ - Audio visualizer     │    │ - Confirmed Facts (5)    │ │
│  │ - Speaker turns        │    │ - Hypotheses (2)         │ │
│  │ - Mute / Device toggle │    │ - Detected Conflicts (1) │ │
│  ├────────────────────────┤    ├──────────────────────────┤ │
│  │ Interactive Timeline   │    │ Human Authorization Card │ │
│  │ - Event audit trail    │    │ - [ Approve ] [ Reject ] │ │
│  └────────────────────────┘    └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Deep Dive: Agora Technology Integration

Sentinel leverages Agora's WebRTC infrastructure and the **Agora Agents SDK**:

| Agora Component | Role in Sentinel | Implementation |
|---|---|---|
| **Agora RTC SDK** (`agora-rtc-sdk-ng`, `agora-rtc-react`) | Provides ultra-low latency, multi-party voice communication on the incident bridge. | [`components/AgoraVoiceRoom.tsx`](components/AgoraVoiceRoom.tsx) joins the channel and manages local microphone audio tracks and remote audio playback. |
| **Agora Token Builder** (`agora-token`) | Dynamically generates short-lived, cryptographically signed tokens with Publisher privileges. | [`app/api/generate-agora-token/route.ts`](app/api/generate-agora-token/route.ts) utilizes `RtcTokenBuilder.buildTokenWithRtm` with channel names and participant UIDs. |
| **Agora Conversational AI** (`agora-agents`) | Deploys an autonomous voice agent directly into the RTC incident room to listen, transcribe, and converse. | [`app/api/invite-agent/route.ts`](app/api/invite-agent/route.ts) configures the agent with STT (Deepgram Nova-3), LLM (GPT-4o-mini), and TTS (MiniMax speech_2_6_turbo). |
| **Agora RTM** (`agora-rtm`) | Streams real-time signaling, SAL registration, and live transcript metadata between the AI agent and client. | Ingested by `AgoraVoiceAI` toolkit and forwarded to `/api/transcript`. |
| **Browser Speech Fallback** | Ensures continuous speech transcription even if external cloud AI agent credentials are unavailable. | Web Speech API integration in `AgoraVoiceRoom.tsx` forwards real-time voice turns to `/api/v1/incidents/INC-2048/events`. |

---

## 4. Truth Engine Intelligence Breakdown

The Sentinel Truth Engine enforces evidence-based operational reasoning:

1. **Confirmed Facts**:
   - Condition, measurement, or reported system state backed by telemetry or direct observation.
   - Example: *"Payment API P99 latency exceeded 8.4 seconds (normal: 84ms)."*
2. **Hypotheses vs. Assumptions**:
   - Isolates unproven explanations and attaches confidence ratings, supporting evidence, and required verification criteria.
   - Example: *"Deployment v4.8.2 introduced connection pool leakage leading to payment timeout cascades (88% confidence)."*
3. **Conflict & Discrepancy Detection**:
   - When different responders provide contradictory reports, Sentinel highlights the discrepancy rather than picking a side.
   - Example: DevOps reports *"Database CPU is 24%, infrastructure healthy"*, while SRE reports *"Checkout connection pool timeouts"*. Sentinel immediately triggers:  
     `⚠️ CONFLICT DETECTED: DevOps reports database normal, directly conflicting with telemetry indicating active degradation.`
4. **Action Ownership & Human-in-the-Loop Approvals**:
   - Tasks are automatically extracted and attributed to named owners (e.g., *"Rahul Mehta"*).
   - For high-risk actions (code rollbacks, database restarts, traffic draining), Sentinel sets `requires_human_approval = true` and generates a pending approval request.
   - Dangerous changes cannot proceed until the Incident Commander clicks **[ Approve Rollback ]** on the console.
   - Every approval decision is immutably logged with timestamp, author, and notes to the live incident timeline.

---

## 5. Local Setup & Running

### Prerequisites
- Node.js >= 20 (v22 recommended)
- Python >= 3.11 (for running Python test suite)

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/your-org/sentinel.git
cd sentinel

# Install root dependencies
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Public Client Variables
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
NEXT_PUBLIC_AGENT_UID=123456

# Server-Only Secrets
NEXT_AGORA_APP_CERTIFICATE=your_agora_app_certificate
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

> **Note**: Sentinel operates out-of-the-box with built-in pattern recognition and Web Speech capture even if Agora credentials have not yet been provisioned.

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Sentinel Incident Command Center.

### Step 4: Run the Backend Test Suite
```bash
python -m pytest incident-intelligence/tests
```

---

## 6. Vercel Production Deployment

Sentinel is designed as a **single full-stack Next.js application** that deploys cleanly on Vercel without manual configuration or fragile multi-service setups.

### Option A: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B: Deploy via Vercel Web Dashboard
1. Import the repository into Vercel.
2. Ensure the **Root Directory** is set to `./` (default).
3. Framework Preset will automatically detect **Next.js**.
4. Configure the Environment Variables:
   - `NEXT_PUBLIC_AGORA_APP_ID`
   - `NEXT_AGORA_APP_CERTIFICATE`
   - `OPENAI_API_KEY`
5. Click **Deploy**.

---

## 7. Evaluator Demonstration Script (3-5 Minutes)

Follow this script for a flawless evaluation presentation:

1. **Introduction (0:00 - 0:30)**
   - Open the deployed application URL.
   - Point out the **SEV-1 CRITICAL: Payment API Outage (INC-2048)** header and live operational status indicator.
   - Explain the core concept: *"Sentinel is an AI Incident Commander that joins the engineer voice bridge via Agora and extracts live operational truth from speech."*

2. **Agora Live Voice Bridge (0:30 - 1:15)**
   - Click **🎙️ Join Agora Incident Room**.
   - Show the Agora RTC connection indicator (`Channel: ai-incident-2048`) and the animated audio visualizer.
   - Speak into your microphone: *"Database connection pool utilization has reached ninety percent."*
   - Watch your voice get transcribed in real time, tagged as `Incident Responder`, and forwarded into the Truth Engine.

3. **Deterministic Incident Scenario (1:15 - 2:30)**
   - Click **⚡ Simulate Incident (Demo)** to run the end-to-end multi-speaker incident workflow.
   - **Step 1**: DevOps engineer Rahul states: *"Database CPU is at 24%, so database health looks completely normal."*
   - **Step 2**: Incident Commander Priya notes checkout timeouts correlating with deployment v4.8.2.
   - **Step 3 (Discrepancy Detection)**: Show the **Surfaced Conflicts** card light up in amber:
     *Sentinel surfaces the direct contradiction between Rahul's infrastructure report and active checkout failure telemetry.*
   - **Step 4 (Remediation Recommendation)**: Sentinel recommends rolling back `payment-service` to v4.8.1.

4. **Human-in-the-Loop Authorization (2:30 - 3:30)**
   - Highlight the high-risk action card: **Rollback payment-service to v4.8.1**.
   - Show the prominent warning: **⚠️ Human Approval Required**.
   - Explain: *"Sentinel never executes high-risk production changes autonomously. It requires explicit human IC authorization."*
   - Click **[ Approve Rollback ]**.
   - Observe the instantaneous state update: action status changes to **✓ APPROVED BY INCIDENT COMMANDER**, and the approval decision is recorded on the live timeline.

5. **Recovery & Postmortem (3:30 - 4:00)**
   - Show recovery telemetry and health returning to 99.6%.
   - Click **Download Postmortem** to download the structured Markdown incident report generated by Sentinel.

---

## 8. Repository Structure

```
sentinel/
├── app/                              # Next.js 16 App Router & Full-Stack API
│   ├── api/
│   │   ├── generate-agora-token/     # Agora RTC/RTM token generator
│   │   ├── invite-agent/             # Agora Conversational AI agent trigger
│   │   ├── stop-conversation/        # Agent session termination
│   │   ├── transcript/               # Turn ingestion endpoint
│   │   ├── health/                   # Sentinel health check
│   │   └── v1/incidents/[id]/        # Truth Engine REST APIs
│   │       ├── events/               # Event ingestion (TruthEngine)
│   │       ├── state/                # Structured incident state
│   │       ├── timeline/             # Event audit timeline
│   │       ├── summary/              # Incident postmortem summary
│   │       ├── approvals/decision/   # Human-in-the-loop decisions
│   │       └── reset/                # Demo reset endpoint
│   ├── page.tsx                      # Main Incident Command Center
│   └── layout.tsx                    # Shell layout & SEO metadata
├── components/                       # UI & Voice Components
│   ├── SentinelCommandCenter.tsx     # Flagship Incident Operations Console
│   └── AgoraVoiceRoom.tsx            # Live Agora RTC Audio Bridge & Visualizer
├── lib/
│   ├── truth-engine/                 # Embedded TypeScript Truth Engine
│   │   ├── types.ts                  # Incident State & Truth Engine Schemas
│   │   └── engine.ts                 # State Manager, Verifier & Conflict Detector
│   └── sentinel.ts                   # Ingestion helpers
├── incident-intelligence/            # Python FastAPI Backend (Reference / Testing)
│   ├── src/                          # Truth Engine & Extractor services
│   └── tests/                        # Pytest automated test suite
├── package.json                      # Unified root package definition
├── vercel.json                       # Zero-config Next.js Vercel deployment
└── .env.example                      # Production environment template
```

---

## 9. License

Developed for the **EchoSphere: Agora Conversational AI Hackathon 2026**. Licensed under the Apache License 2.0.