# GridWise — Smart Campus Energy Optimization (Go)

LLM-assisted energy scheduling service for the **BUP CSE Fest 2026 Hackathon, Online Preliminary** (GridWise challenge).

The service takes a 24-hour campus energy scenario plus 1–3 natural-language operator notes, and returns two things: a machine-checkable interpretation of those notes, and a valid 24-hour operating plan with the lowest grid cost it can find.

Written in Go using only the standard library. No web framework, no solver package.

**Live endpoint:** `http://20.196.201.41`
**Repository:** https://github.com/Twaha-Rahman/bup-hackathon-submission

---

## Architecture

```
POST /optimize-energy
  │  controller: request validation (400 / 422)
  ▼
  LLM interpretation  — OpenRouter, single call, one entry per note
  │  output treated as untrusted JSON
  ▼
  deterministic guardrails — count, type, hours, numbers, applies semantics
  │  anything invalid degrades to no_op; never invented, never a crash
  ▼
  optimizer — exact dynamic programming over (hour × battery level)
  ▼
  independent replay validator → totals recomputed from the plan → 200
```

The language model is used for one job only: turning operator notes into `directive_interpretation`. It is never used just for summary text. Every number in the schedule — effective solar, reserves, charge and discharge windows, grid caps, battery physics, end-of-day neutrality, totals — comes from deterministic code.

If the model is unreachable or returns unusable output, all notes degrade safely to `no_op` and the service still returns a valid schedule.

---

## Quickstart

Requires Go 1.22 or newer.

```bash
git clone https://github.com/Twaha-Rahman/bup-hackathon-submission
cd bup-hackathon-submission

cp .env.example .env
# open .env and set OPENROUTER_API_KEY

go run .
```

The server binds to `0.0.0.0:$PORT` (default `3000`).

Check it is up:

```bash
curl -s http://localhost:3000/health
# {"status":"ok"}
```

Build a binary instead:

```bash
go build -o server .
./server
```

---

## Docker fallback

```bash
docker build -t gridwise .
docker run -d -p 3000:3000 --env-file .env --name gridwise-container gridwise
curl -s http://localhost:3000/health
```

The image exposes port 3000, binds to `0.0.0.0`, and contains no baked-in credentials. Pass the key at run time with `--env-file`.

---

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes, for live interpretation | OpenRouter API key |
| `PORT` | No (default `3000`) | Listen port |

**Model and provider:** OpenRouter `deepseek/deepseek-v4-flash-0731:free`, reasoning enabled, pinned to `open-inference/fp8`, no provider fallbacks. Called over the OpenAI-compatible `POST /api/v1/chat/completions` endpoint with `response_format: json_object` and `temperature: 0.0`.

**Timing:** the LLM call has an 18-second timeout inside a 20-second request budget, against the judge limit of 30 seconds. Interpretations are cached (TTL 300s success, 60s failure, 100 keys) and one bounded retry is attempted on 429 or 503.

---

## Endpoints

### GET /health

```json
{ "status": "ok" }
```

### POST /optimize-energy

Accepts one scenario object, returns the interpretation plus the 24-hour plan. Full field definitions live in the Problem Statement, which is the canonical contract.

**Validation behaviour**

| Condition | Response |
|---|---|
| Malformed JSON | `400 {"error":"Malformed JSON body."}` |
| Missing or non-string `scenario_id` | `400` |
| `operator_notes` not an array | `400` |
| `operator_notes` wrong count or empty entries | `422` |
| `hours` not exactly 24 unique hours 0–23 | `400` |
| Negative or non-finite numbers | `422` |
| `battery` missing fields | `400` |
| Incoherent battery levels (`minimum > initial`, `initial > capacity`, negatives) | `422` |
| Internal panic | `500 {"scenario_id": ..., "error":"Internal server processing failure."}` |

No secrets or stack traces appear in any response. The API key travels in a header, never in a URL.

---

## Sample request

```bash
curl -s http://localhost:3000/optimize-energy \
  -H 'Content-Type: application/json' \
  -d '{
    "scenario_id": "GRID-101",
    "operator_notes": [
      "Solar output will drop to about 20% from 1 PM to 3 PM.",
      "Do not charge the battery between 2 PM and 4 PM."
    ],
    "hours": [
      {"hour": 0,  "demand_kwh": 180, "solar_kwh": 0,   "tariff_bdt_per_kwh": 7},
      {"hour": 1,  "demand_kwh": 170, "solar_kwh": 0,   "tariff_bdt_per_kwh": 6},
      {"hour": 2,  "demand_kwh": 160, "solar_kwh": 0,   "tariff_bdt_per_kwh": 6},
      {"hour": 3,  "demand_kwh": 160, "solar_kwh": 0,   "tariff_bdt_per_kwh": 6},
      {"hour": 4,  "demand_kwh": 170, "solar_kwh": 0,   "tariff_bdt_per_kwh": 7},
      {"hour": 5,  "demand_kwh": 190, "solar_kwh": 0,   "tariff_bdt_per_kwh": 8},
      {"hour": 6,  "demand_kwh": 210, "solar_kwh": 20,  "tariff_bdt_per_kwh": 10},
      {"hour": 7,  "demand_kwh": 240, "solar_kwh": 80,  "tariff_bdt_per_kwh": 12},
      {"hour": 8,  "demand_kwh": 260, "solar_kwh": 150, "tariff_bdt_per_kwh": 15},
      {"hour": 9,  "demand_kwh": 280, "solar_kwh": 220, "tariff_bdt_per_kwh": 18},
      {"hour": 10, "demand_kwh": 290, "solar_kwh": 280, "tariff_bdt_per_kwh": 20},
      {"hour": 11, "demand_kwh": 300, "solar_kwh": 320, "tariff_bdt_per_kwh": 22},
      {"hour": 12, "demand_kwh": 310, "solar_kwh": 350, "tariff_bdt_per_kwh": 25},
      {"hour": 13, "demand_kwh": 300, "solar_kwh": 340, "tariff_bdt_per_kwh": 24},
      {"hour": 14, "demand_kwh": 290, "solar_kwh": 300, "tariff_bdt_per_kwh": 22},
      {"hour": 15, "demand_kwh": 280, "solar_kwh": 220, "tariff_bdt_per_kwh": 20},
      {"hour": 16, "demand_kwh": 270, "solar_kwh": 130, "tariff_bdt_per_kwh": 18},
      {"hour": 17, "demand_kwh": 290, "solar_kwh": 40,  "tariff_bdt_per_kwh": 22},
      {"hour": 18, "demand_kwh": 320, "solar_kwh": 0,   "tariff_bdt_per_kwh": 28},
      {"hour": 19, "demand_kwh": 310, "solar_kwh": 0,   "tariff_bdt_per_kwh": 30},
      {"hour": 20, "demand_kwh": 280, "solar_kwh": 0,   "tariff_bdt_per_kwh": 26},
      {"hour": 21, "demand_kwh": 240, "solar_kwh": 0,   "tariff_bdt_per_kwh": 18},
      {"hour": 22, "demand_kwh": 210, "solar_kwh": 0,   "tariff_bdt_per_kwh": 10},
      {"hour": 23, "demand_kwh": 190, "solar_kwh": 0,   "tariff_bdt_per_kwh": 7}
    ],
    "battery": {
      "capacity_kwh": 500,
      "initial_energy_kwh": 200,
      "minimum_energy_kwh": 50,
      "max_charge_kwh_per_hour": 100,
      "max_discharge_kwh_per_hour": 100
    }
  }'
```

Response (abbreviated):

```json
{
  "directive_interpretation": [
    {
      "note_index": 0,
      "applies": true,
      "directive_type": "solar_reduction",
      "structured_adjustment": { "factor": 0.2, "hours": [13, 14] },
      "explanation": "Solar output drops to 20% of normal from 1 PM to 3 PM."
    },
    {
      "note_index": 1,
      "applies": true,
      "directive_type": "no_charge_window",
      "structured_adjustment": { "hours": [14, 15] },
      "explanation": "Battery charging is unavailable from 2 PM to 4 PM."
    }
  ],
  "hourly_plan": [
    {
      "hour": 0,
      "grid_kwh": 80,
      "solar_used_kwh": 0,
      "battery_action": "discharge",
      "battery_kwh": 100,
      "battery_energy_after_kwh": 100
    }
  ],
  "total_grid_kwh": 0,
  "total_cost_bdt": 0,
  "peak_grid_kwh": 0,
  "plan_summary": "..."
}
```

Two conventions worth repeating, because they are the easiest things to get wrong. A window from 1 PM to 3 PM is hours `[13, 14]` — start included, end excluded. For `solar_reduction`, `factor` is the fraction that remains, so an 80% reduction is `0.2`.

---

## Public-sample test procedure

The 10 worked cases are in `instructions/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json`, each with `input`, `expected_output`, and `rationale`.

Start the service, then run:

```bash
python3 - <<'EOF'
import json, urllib.request
pack = json.load(open('instructions/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json'))
for c in pack['cases']:
    req = json.dumps(c['input']).encode()
    r = urllib.request.Request('http://localhost:3000/optimize-energy',
        data=req, headers={'Content-Type': 'application/json'})
    out = json.load(urllib.request.urlopen(r, timeout=60))
    exp = c['expected_output']
    got  = [(e['directive_type'], e['applies']) for e in out['directive_interpretation']]
    want = [(e['directive_type'], e['applies']) for e in exp['directive_interpretation']]
    print(c['id'], 'interp_match=', got == want,
          'cost=%.1f ref=%.1f' % (out['total_cost_bdt'], exp['total_cost_bdt']))
EOF
```

Expected result: interpretation semantics match on every case, and `total_cost_bdt` equals the reference optimal cost. Equivalent optima are accepted by the judge; exact equality is what the DP solver reaches locally.

---

## Layout

| File | Role |
|---|---|
| `main.go` | dotenv loader, env check, `ListenAndServe` on `0.0.0.0:$PORT` |
| `internal/app/app.go` | mux, `GET /health`, panic to controlled 500 |
| `internal/routes/routes.go` | `POST /optimize-energy` registration |
| `internal/controllers/energy_controller.go` | request validation, pipeline wiring, response assembly, recomputed totals, deterministic `plan_summary` |
| `internal/services/ai_service.go` | LLM client, guardrail sanitizer, TTL cache, bounded retry, all-`no_op` safe failure |
| `internal/optimizer/optimizer.go` | directive decoding, constraint building, DP solver, totals, replay validator |
| `internal/optimizer/optimizer_test.go` | optimizer unit tests |

Run tests with `go test ./...`.

---

## Dependencies, limitations, secrets

**Dependencies:** Go 1.22+ standard library only. No external packages. The only outside service is the OpenRouter API.

**Known limitations**

- The DP solver quantizes battery energy at 0.5 kWh, with a 0.25 kWh fallback. Scenarios with finer granularity in `initial_energy_kwh` may be rejected rather than scheduled.
- Free-tier LLM quota applies. Under sustained 429 or 503 the service returns valid all-`no_op` schedules: validity is preserved, but interpretation credit for those cases is lost. One bounded retry is attempted per request.
- Infeasible scenarios with contradictory hard directives — which the organizers exclude from scoring — return controlled 500s.

**Secret handling:** keys live only in a local `.env`, which is git-ignored and never committed, logged, or returned in a response. The Docker image contains no credentials.

---

## Canonical sources

The Problem Statement is canonical for endpoints, schemas, directive types, guardrails, battery behaviour, and optimization validity. The Participant Guide and Evaluation Rubric is canonical for deployment, submission, scoring, penalties, and tie-breakers. Both are in `instructions/`.

All scenario data is synthetic. No live campus, utility, billing, or personal data is used.