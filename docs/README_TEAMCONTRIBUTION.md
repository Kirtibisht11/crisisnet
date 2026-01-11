# CrisisNet - Team Contribution

## Project Overview
CrisisNet is a **multi-agent AI crisis response platform** that coordinates citizens, volunteers, authorities, and NGOs during emergencies. Each team member owns a specific AI agent and its corresponding features.

---

## Team Roles & Responsibilities

### DISHA - Detection & Citizen Security
**Agent Owned:** Detection Agent

#### Core Responsibilities
- **Crisis Detection Logic** - Monitor social feeds, detect abnormal signals
- **Early Warning System** - Keyword matching, sentiment analysis, geo-clustering
- **Severity & Confidence Scoring** - Estimate emergency level and detection reliability
- **Authentication System** - Role-based login (Citizen/Volunteer/Authority)
- **AI Crisis Companion** - Predefined safety instructions and emotional reassurance

#### Key Components
**Backend:** Detection agent, signal ingestion, keyword/sentiment engines, spike detector  
**Frontend:** AlertCard, ConfidenceBadge

**Goal:** Early crisis sensing + secure citizen support

---

### SIMRAN - Trust Governance & Authority Control
**Agent Owned:** Trust Agent

#### Core Responsibilities
- **Misinformation Prevention** - Cross-verify multiple sources, filter duplicates
- **Trust Scoring** - Calculate credibility and source reputation
- **Authority Dashboard** - Agent status panel, event timeline
- **Manual Override System** - Allow authorities to intervene when needed
- **Transparency Layer** - Show AI decision-making flow

#### Key Components
**Backend:** Trust agent, cross-verification, duplicate detector, rate limiter  
**Frontend:** Authority dashboard, AgentStatusPanel, data formatters

**Goal:** Prevent misinformation + ensure human oversight

---

### KIRTI - Community Activation & Resource Execution
**Agent Owned:** Resource Agent

#### Core Responsibilities
- **Volunteer Management** - Signup system, skill tracking, availability
- **Task Assignment** - Match volunteers to crises based on distance, skills, priority
- **Geo-Optimization** - Haversine distance calculation for nearest help
- **Task Dashboard** - Show assigned tasks, location, routes
- **Resource Coordination** - Prevent overload and handle reassignments

#### Key Components
**Backend:** Resource agent, matcher, geo-optimizer, skill matcher  
**Frontend:** MapView, ResourceList, volunteer dashboard, crisis state management

**Goal:** Activate local volunteers effectively

---

### LAVIKA - Communication & Reliability
**Agent Owned:** Communication Agent

#### Core Responsibilities
- **Multi-Channel Alerts** - Telegram, dashboard notifications
- **Real-Time Updates** - WebSocket integration for live crisis sync
- **Bilingual Support** - English and Hindi communication
- **Low-Internet Fallback** - Ensure communication in poor connectivity
- **User Interfaces** - Citizen, volunteer, and NGO dashboards
- **API Integration** - Connect frontend to backend services

#### Key Components
**Backend:** Communication agent, message templates, channel router, retry manager  
**Frontend:** All user dashboards (citizen/volunteer/NGO), API services, WebSocket, state management, global styling

**Goal:** Reliable last-mile crisis communication

---

## Agent Intelligence Flow

```
Crisis Signal
    ↓
Detection Agent (DISHA) → Detect & classify
    ↓
Trust Agent (SIMRAN) → Verify & score
    ↓
Resource Agent (KIRTI) → Assign volunteers
    ↓
Communication Agent (LAVIKA) → Alert all parties
    ↓
Human Action
```

---

## Round 1 Feature Breakdown

| Member | Features Delivered |
|--------|-------------------|
| **DISHA** | Role-based auth, route protection, AI Crisis Companion |
| **SIMRAN** | Agent status panel, event timeline, manual override |
| **KIRTI** | Volunteer signup, task dashboard, map view |
| **LAVIKA** | Telegram integration, bilingual support, real-time dashboards, WebSockets |

---

## Technology Stack

**Backend:** Python, FastAPI, Telegram Bot API  
**Frontend:** React.js, Zustand (state), OpenStreetMap  
**Communication:** WebSockets, Telegram  
**Languages:** English, Hindi  
**Deployment:** Vercel/Railway

---

## Round 2 Enhancements (Planned)

- **Learning Agent** - Optimize decisions from past crises
- **Extended Multilingual Support** - Additional regional languages
- **Offline-First** - Sync when connectivity returns
- **Voice Assistance** - Audio-based crisis guidance
- **NGO Integration** - Large-scale coordination

---

## Why This Structure Works

- **Clear Ownership** - Each member owns one agent end-to-end
- **Independent Development** - Agents don't block each other
- **Scalable** - Add new agents without breaking existing ones
- **Explainable** - Mimic real-world emergency workflows

---

**Version:** 1.0  
**Project:** CrisisNet - Human-Centric Crisis Response Platform