# Data Flow Documentation (DFD)

## Login Flow
1. User enters credentials
2. Location auto-detected
3. Auth API validates user
4. JWT token issued
5. User stored in Zustand + localStorage
6. Redirect based on role

## Crisis Lifecycle
Citizen/Authority creates crisis
→ Stored in backend
→ Trust score assigned
→ Visible to NGOs
→ NGO accepts crisis
→ Tasks created
→ Volunteers assigned
→ Status updates propagated

## Data Storage
- localStorage: session, volunteerId
- Zustand stores: UI state
- Backend: users, crises, tasks


Data & Control Flow Summary

Crisis is created or simulated

Detection Agent registers the event

Trust Agent validates credibility

Resource Agent assigns volunteers/resources

Communication Agent notifies users via Telegram

UI updates in real time via state stores

1. High-Level Data Flow (System-Wide)
```text
User Action
(Citizen / Authority / NGO / Volunteer)
        │
        ▼
┌─────────────────────────────┐
│        React UI             │
│  - Forms                    │
│  - Dashboards               │
│  - Maps & Tasks             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     Zustand Stores          │
│  - userStore                │
│  - crisisStore              │
│  - volunteerStore           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     API Layer               │
│  Axios / Fetch              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     Backend (FastAPI)       │
│  - Auth APIs                │
│  - Crisis APIs              │
│  - Resource APIs            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Agent Processing       │
│  Detection → Trust →        │
│  Resource → Communication   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ External Communication      │
│  Telegram Bot               │
│  (WhatsApp – Planned)       │
└─────────────────────────────┘
```

2. Authentication & Login Data Flow
```text
User
 │
 │  Enter Phone / Password
 ▼
React Login Form
 │
 │  Auto-detect Location
 ▼
Location Utility
 │
 │  Attach lat / lon
 ▼
Auth API  ──────────────┐
 │                       │
 │  Validate credentials │
 ▼                       │
JWT Token Generated ◀────┘
 │
 │  Save token + user
 ▼
Zustand Store + localStorage
 │
 │
 ▼
Role-Based Redirect
(Citizen / Volunteer / Authority)
```

3. Crisis Creation & Validation Flow
```text
Citizen / Authority
 │
 │  Create Crisis
 ▼
React Crisis Form
 │
 │  POST /crisis
 ▼
Backend API
 │
 ▼
Detection Agent
 │
 │  Register Event
 ▼
Trust Agent
 │
 │  Assign Trust Score
 ▼
Crisis Stored (Backend Memory / DB)
 │
 ▼
Visible to NGOs & Authorities
```

4. NGO Acceptance & Task Generation Flow
```text
NGO Dashboard
 │
 │  Accept Crisis
 ▼
Backend API
 │
 ▼
Resource Agent
 │
 │  Match resources & volunteers
 ▼
Task Objects Created
 │
 ▼
Tasks Stored (Backend)
 │
 ▼
Volunteer Assignment Triggered
```

5. Volunteer Task Execution Flow
```text
Volunteer Dashboard
 │
 │  Fetch Assigned Tasks
 ▼
Backend API
 │
 ▼
Task List Returned
 │
 ▼
Volunteer Updates Status
 │
 │  (In Progress / Completed)
 ▼
Backend API
 │
 ▼
State Updated
 │
 ▼
UI + Authorities Notified
```

6. Communication & Alert Flow
```text
Agent Event
 │
 │  Crisis / Task Update
 ▼
Communication Agent
 │
 │  Format Message
 ▼
Telegram Bot API
 │
 │
 ▼
End Users
(Citizens / Volunteers / NGOs)
```

7. Data Storage Overview
```text
Frontend
 ├─ localStorage
 │   ├─ access_token
 │   ├─ user
 │   └─ volunteerId
 │
 └─ Zustand Stores
     ├─ userStore
     ├─ crisisStore
     └─ volunteerStore


Backend
 ├─ Users
 ├─ Crises
 ├─ Tasks
 └─ Agent Outputs
 ```