# CrisisNet – Data Flow Documentation (DFD)

This document explains how data flows through CrisisNet, from user actions on the frontend to agent-driven decisions, task allocation, and real-time notifications. The flows are divided into Round-1 (Implemented) and Round-2 (Enhanced Architecture & Scalability).

## 1. Authentication & Login Flow (Round-1 – Implemented)

**Purpose:**
Provide secure, role-based access with location awareness for all users.

**Flow:**

1. User enters phone number / credentials
2. Frontend auto-detects user location (latitude, longitude)
3. Credentials sent to Auth API
4. Backend validates user
5. JWT token is issued
6. Session stored in Zustand + localStorage
7. User redirected based on role

**Roles:**
- Citizen
- Volunteer
- NGO
- Authority

```
User
 |
 | Enter Credentials
 v
React Login Form
 |
 | Auto-detect Location
 v
Auth API (FastAPI)
 |
 | Validate User
 v
JWT Token Issued
 |
 v
Zustand Store + localStorage
 |
 v
Role-Based Dashboard
```

## 2. Crisis Creation & Validation Flow (Round-1 – Implemented)

**Purpose:**
Capture crisis events and verify credibility before escalation.

**Flow:**

1. Citizen / Authority creates a crisis
2. Crisis sent to backend API
3. Detection Agent registers the event
4. Trust Agent assigns initial trust score
5. Crisis stored in database
6. Crisis visible to NGOs & Authorities

```
Citizen / Authority
 |
 | Create Crisis
 v
React Crisis Form
 |
 v
Backend API
 |
 v
Detection Agent
 |
 v
Trust Agent
 |
 v
Crisis Stored (DB)
 |
 v
Visible to NGOs & Authorities
```

## 3. NGO Acceptance & Task Generation (Round-1 – Implemented)

**Purpose:**
Convert verified crises into actionable response tasks.

**Flow:**

1. NGO reviews available crises
2. NGO accepts a crisis
3. Resource Agent assigns volunteers & resources
4. Tasks are created
5. Volunteers are notified

```
NGO Dashboard
 |
 | Accept Crisis
 v
Backend API
 |
 v
Resource Agent
 |
 | Match Volunteers & Resources
 v
Tasks Created
 |
 v
Volunteers Assigned
```

## 4. Volunteer Task Execution Flow (Round-1 – Implemented)

**Purpose:**
Track task progress and completion in real time.

**Flow:**

1. Volunteer fetches assigned tasks
2. Volunteer updates task status
3. Backend updates task state
4. NGOs & Authorities see updates instantly

```
Volunteer Dashboard
 |
 | Fetch Tasks
 v
Backend API
 |
 v
Task List
 |
 | Update Status
 v
Backend API
 |
 v
Task State Updated
 |
 v
UI + Authority / NGO Notified
```

## 5. Communication & Alerts Flow (Round-1 – Implemented)

**Purpose:**
Ensure users receive timely alerts during crises.

**Flow:**

1. Crisis or task update triggers event
2. Communication Agent handles notifications
3. Alerts sent via Telegram + WebSocket

```
Agent Event
 |
 | Crisis / Task Update
 v
Communication Agent
 |
 v
Telegram Bot API / WebSocket
 |
 v
End Users (Citizen / Volunteer / NGO)
```

## 6. High-Level System Data Flow (Round-1)

```
User Action
(Citizen / Volunteer / NGO / Authority)
        |
        v
+-----------------------------+
|        React Frontend       |
|  Forms • Dashboards • Maps |
+--------------+--------------+
               |
               v
+-----------------------------+
|      Zustand State Store    |
+--------------+--------------+
               |
               v
+-----------------------------+
|      FastAPI Backend        |
| Auth • Crisis • Resources  |
+--------------+--------------+
               |
               v
+-----------------------------+
|       Agent Pipeline        |
| Detection → Trust → Resource|
+--------------+--------------+
               |
               v
+-----------------------------+
| Communication (Telegram/WS) |
+-----------------------------+
```

## Round-2: Enhanced & Scalable Data Flow

Round-2 evolves CrisisNet from a linear pipeline to a parallel, event-driven system designed for scale and resilience.

## 7. Round-2 Crisis Processing Flow (Enhanced)

**Purpose:**
Handle high-volume crises with better intelligence, speed, and analytics.

**Flow:**

```
Incoming Signals
(Social / Manual / API)
        |
        v
Detection Agent (v2)
- NLP Classification
- Severity Scoring
- Geo Clustering
        |
        v
Trust Agent (v2)
- Multi-source Corroboration
- Temporal + Spatial Confidence
        |
        v
Event Stream / WebSocket Dispatcher
        |
        v
Resource Agent (v2)
- Skill Matching
- ETA Optimization
- Reliability Weighting
        |
        v
NGO Ownership Layer
        |
        v
Communication Agent
- Live Dashboards
- Telegram Alerts
        |
        v
Learning Agent
- Feedback Loop
- Performance Optimization
        |
        v
Analytics & Reports
```

## 8. Unified System Architecture (Round-1 + Round-2)

```
Frontend (React)
  |
  | HTTP / WebSocket
  v
Backend (FastAPI)
  |
  +-- Detection Agent
  +-- Trust Agent
  +-- Resource Agent
  +-- Communication Agent
  +-- Learning Agent (Round-2)
  |
  v
Database (PostgreSQL / SQLite)
  |
  v
External Services
(Telegram • Maps • Voice APIs)
```

## 9. Scalability & Failure Handling (Round-2 Focus)

**Scalability:**
- Stateless FastAPI backend → horizontal scaling
- Event-driven agents → parallel crisis processing
- WebSockets → no polling bottlenecks
- Database-backed storage → safe concurrent access

**Failure Handling:**
- Agents are isolated (failure doesn't crash system)
- Manual authority override always available
- Learning Agent is advisory only
- Graceful degradation (alerts work even if AI fails)

## 10. Data Storage Overview

**Frontend:**
```
localStorage
 +-- access_token
 +-- user
 +-- role

Zustand Stores
 +-- userStore
 +-- crisisStore
 +-- volunteerStore
```

**Backend:**
```
Database Tables
 +-- Users
 +-- Crises
 +-- Tasks
 +-- Agent Outputs
 +-- Analytics (Round-2)
```