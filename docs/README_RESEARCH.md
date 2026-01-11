# CrisisNet – Design & Research Notes

## Problem
Real disaster responses face key challenges:
- **Information**: Late/incomplete alerts
- **Verification**: High false reports
- **Coordination**: Poor sync between citizens, volunteers, authorities
- **Resources**: Nearby help underutilized
- **Scale**: Systems fail during surges

---

## Design Principles

1. **Humans control** – AI supports, doesn't replace authorities
2. **Clear separation** – Each agent has one task
3. **Simple first** – Rules before learning
4. **Crisis-first UX** – Calm UI, minimal steps

---

## Why Multi-Agent?

| Agent | Purpose |
|-------|---------|
| Detection | Identify crises |
| Trust | Verify credibility |
| Resource | Assign volunteers |
| Communication | Send alerts |
| Learning | Improve over time |

Each agent is independent, explainable, and upgradeable.

---

## Key Research Insights

**Location matters most:**
- Nearby duplicates increase credibility
- Geo-clustering detects real emergencies
- Distance impacts response time

**Trust is explainable:**
- Rule-driven (not black-box)
- Multi-source verification
- Time + location confidence

**Smart allocation:**
- Not just nearest volunteer
- Considers: distance, skills, availability, reliability

---

## Technical Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React | Predictable UI |
| Backend | FastAPI | Async APIs |
| Real-Time | WebSockets | Live updates |
| Database | PostgreSQL | Reliability |
| Maps | Leaflet | Flexible |

---

## Round 2 Improvements

- WebSockets for instant sync
- Learning agent (outcome-based, not assumption-based)
- Voice guidance for accessibility
- Database persistence

---

## Ethics & Safety

- No automated life-critical actions
- Authority override always available
- Transparent scoring
- Clear limitations

---

**Version:** 1.1  
**Focus:** Research-driven emergency response system