# CrisisNet Copilot Instructions

CrisisNet is a multi-agent AI system for disaster management. It detects crises, verifies trust, allocates resources, and sends multilingual alerts via Telegram/WhatsApp.

## Architecture Overview

### Four Core Agents (Independence + Orchestration)
- **Detection Agent** (`backend/agents/detection_agent.py`): Ingests signals → classifies crisis type → estimates severity/confidence → detects spikes → logs to `data/alerts_log.json`
- **Trust Agent** (`backend/agents/trust_agent.py`): Verifies alerts via cross-verification, reputation scoring, duplicate detection, and rate limiting
- **Resource Agent** (`backend/agents/resource_agent.py`): Allocates resources/volunteers using geo-optimization, skill matching, and priority scoring; handles dynamic reassignment when higher-priority crises appear
- **Communication Agent** (`backend/agents/communication_agent.py`): Builds role-specific messages and sends via Telegram (`send_telegram_message`) or WhatsApp (PyWhatKit)

### Data Flow
```
Signal (text/location) → Detection (classify + severity) → Trust (verify + score) 
→ Resource (allocate) → Communication (notify via Telegram)
```

### API Routers (all under `/api/` except noted)
- `/users` - registration (citizens/volunteers/authorities)
- `/crisis` - detection endpoint, logs to `crises.json`
- `/alerts` - mock scenarios, alert history
- `/trust` - verification status
- `/assignments` - resource allocations
- `/notify` - message delivery status
- `/volunteer` - volunteer management
- `/geo` - location services
- `/auth` - token generation/validation

## Data Storage & Formats

### JSON Files (Production mode)
- `users.json` - user registry with roles and profiles
- `crises.json` - active/resolved crises
- `data/alerts_log.json` - all detected alerts with verification status
- `data/resources.json` - available resources (medical, rescue, shelter)
- `data/volunteers.json` - volunteer availability and skills
- `.env` - Telegram bot token, API keys

**Key pattern**: Load/save JSON files in API handlers; agents don't directly handle I/O (except detection_agent's alerts_log for logging).

## Critical Patterns

### Detection Pipeline (Extensible Module Pattern)
Each detection step is a separate function in `backend/agents/detection/`:
- `signal_ingestion.py`: Load signals
- `event_classifier.py`: Keyword matching via `CRISIS_KEYWORDS` dict
- `severity_estimator.py`: Returns 'low'/'medium'/'high' based on event type
- `confidence_estimator.py`: 0-1 score from text quality
- `spike_detector.py`: Geo-bucketing (lat/lon precision) detects clusters of similar alerts
- `sentiment_engine.py`: Text sentiment scoring

**When extending detection**: Add new module, import in `detection_agent.py`, call after current pipeline.

### Resource Allocation (Composite Optimizer)
The Resource Agent chains multiple sub-engines:
```python
# Pattern from resource_agent.py
available = availability_manager.get_available(resources, crisis_type)
optimized = geo_optimizer.optimize_allocation(available, crisis_location, priority)
matched = skill_matcher.match_skills(volunteers, required_skills)
allocation = matcher.create_allocation(crisis, optimized, matched)
availability_manager.mark_allocated(allocation['resources'])
```

**Reassignment flow**: When a higher-priority crisis arrives, `reassignment_engine.reallocate()` pulls resources from lower-priority assignments.

### Trust Scoring (Weighted Components)
From `backend/core/config.py`:
```python
"scoring_weights": {
    "cross_verification": 0.40,  # verified by multiple sources
    "source_reputation": 0.25,   # user trust history
    "duplicate_check": 0.20,     # similarity to recent alerts
    "rate_limit_penalty": 0.15   # user report frequency
}
```

Verification decisions: >0.65 = auto-verify, 0.45-0.65 = review, <0.30 = reject.

## Role-Based Access Control

- **Citizens**: Report crises, view alerts for their zone
- **Volunteers**: Accept assignments, update availability
- **Authorities**: Detect crises (via system), allocate resources, manage zones
- **NGOs**: Manage external resources

Check `backend/core/role_guard.py`: `require_role(token, ["authority"])` validates JWT and role before operations.

**Auth pattern**: All protected endpoints require `Authorization: Bearer <token>` header; token payload includes `role` field.

## Development Workflows

### Run Backend
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API docs: `http://localhost:8000/docs`

### Run Frontend
```bash
cd frontend
npm install
npm run dev  # Vite dev server at localhost:5173
```

### Testing Alerts
- **POST** `/crisis/detect` with `CrisisCreate` (type, severity, lat, lon, radius_km)
- **GET** `/crisis/active` to see active crises
- **POST** `/api/simulate/trigger-demo` to load mock data from `backend/agents/trust/mock_alerts.json`

### Debugging
- Backend logs to `crisisnet.log` and stdout (logging configured in `main.py`)
- Check `data/alerts_log.json` for detection pipeline output
- Telegram test: verify `BOT_TOKEN` and `CITIZEN_IDS`/`VOLUNTEER_IDS` in `communication_agent.py` are valid

## Key Conventions

1. **File organization**: Agents handle business logic; APIs handle HTTP/JSON. Services are thin (e.g., `location_service.py`).
2. **Error handling**: Catch exceptions in APIs, return HTTP 500 with detail; agents log to file or print.
3. **Geo-spatial**: All coordinates stored as (latitude, longitude); geo_optimizer uses haversine-like distance, spike_detector buckets by rounded lat/lon for clustering.
4. **Message building**: Separate builders per crisis type in communication_agent (`build_citizen_flood_message`, etc.); reuse `send_telegram_message` for delivery.
5. **Availability tracking**: Resources/volunteers marked as allocated/released; `ReassignmentEngine` only pulls from lower-priority allocations.

## External Integrations

- **Telegram**: `requests.post` to `https://api.telegram.org/bot{BOT_TOKEN}/sendMessage`; bot token in `.env` or hardcoded
- **WhatsApp**: PyWhatKit async calls; requires session setup (check `communication_agent.py`)
- **Location**: Basic haversine distance in `geo_optimizer.py`; no external API yet

## New Feature Template

**Adding a new agent capability**:
1. Create module in `backend/agents/{name}/` with focused functions
2. If reading data, load in API route not agent
3. If async (Telegram, heavy computation), add to `background_tasks` in route
4. Call from orchestrator (e.g., `trust_agent` calls `resource_agent` in verify flow)
5. Log decisions to JSON or print; update `alerts_log.json` if crisis-related

**Adding an API endpoint**:
1. Create Pydantic model in relevant `api/{route}.py`
2. Use `@router.post/get` decorator, prefix set in module init
3. Wrap role-sensitive ops with `require_role(token, ["role"])`
4. Return `{"status": "success", "data": ...}` or raise `HTTPException`
