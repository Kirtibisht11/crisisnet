# System Architecture – CrisisNet
1. Architecture Overview

CrisisNet is built as a multi-agent, role-based emergency response system.
The architecture separates UI, state, backend logic, and communication to ensure scalability and fast coordination during crises.

The system follows a Frontend → Backend → Agent → Communication pipeline.

## High-Level Architecture
```text
                         ┌───────────────────────────┐
                         │        End Users           │
                         │  Citizen | Volunteer |     │
                         │  Authority | NGO            │
                         └──────────────┬────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - Role-based Dashboards                                    │
│  - Crisis Views, Maps, Tasks                                │
│  - Login / Signup                                           │
│                                                            │
│  State Management: Zustand                                  │
│  - userStore                                                │
│  - crisisStore                                             │
│  - volunteerStore                                          │
└──────────────┬─────────────────────────────────────────────┘
               │  HTTP (Axios / Fetch)
               ▼
┌────────────────────────────────────────────────────────────┐
│                  Backend API (FastAPI)                      │
│  - Auth & Role Validation                                   │
│  - Crisis Lifecycle APIs                                    │
│  - Resource & Volunteer APIs                                │
│  - Task Assignment                                          │
└──────────────┬─────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────┐
│                    Agent Layer                              │
│                                                            │
│  ┌───────────────┐    ┌───────────────┐                    │
│  │ Detection     │──▶ │ Trust Agent   │                    │
│  │ Agent         │    │ (Verification)│                    │
│  └───────────────┘    └───────────────┘                    │
│            │                     │                          │
│            ▼                     ▼                          │
│     ┌───────────────┐    ┌───────────────┐                 │
│     │ Resource      │──▶ │ Communication │                 │
│     │ Agent         │    │ Agent         │                 │
│     └───────────────┘    └───────────────┘                 │
│                                                            │
│     (Learning Agent – Planned for Round 2)                  │
└──────────────┬─────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────┐
│            Communication & External Services                │
│  - Telegram Bot (Live Alerts)                               │
│  - WhatsApp (Planned)                                       │
└────────────────────────────────────────────────────────────┘
```
    
## Layer Responsibilities
1. Frontend (React)
   - Role-specific dashboards for Citizen, Volunteer, NGO, and Authority.
2. State Management (Zustand)
   - Centralized state for users, crises, volunteers, and agent outputs.
3. API Layer
   - Handles authenticated requests and data exchange with backend.
4. Backend (FastAPI)
   - Core orchestration layer handling crisis lifecycle and agent execution.
5. Agent Layer
   - Modular agents that process detection, trust, resource matching, and communication.
6. Communication Layer
   - Real-time alerts via Telegram (WhatsApp planned).

## Agent-Based Design
1. Detection Agent
   - Identifies crisis events (manual + simulated)
2. Trust Agent
   - Scores credibility of crisis data
3. Resource Agent
   - Matches volunteers & resources
4. Communication Agent
   - Sends alerts via Telegram
5. Learning Agent (planned)
   - Improves matching over time