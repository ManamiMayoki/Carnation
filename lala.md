# GridWise — Smart Campus Energy Optimization

An LLM-assisted energy scheduling and optimization service built for the **BUP CSE Fest 2026 Hackathon** (Online Preliminary: GridWise Challenge)[cite: 10]. 

* **Live Endpoint:** `http://20.196.201.41`[cite: 9]
* **Repository:** [Twaha-Rahman/bup-hackathon-submission](https://github.com/Twaha-Rahman/bup-hackathon-submission)[cite: 9]

---

## Architecture Flow

The system processes energy scenarios and natural-language operator notes through a strict four-stage pipeline:

```text
[Energy Data + Notes] ──► [LLM Interpreter] ──► [Guardrail Validator] ──► [DP Optimizer] ──► [Replay Validator] ──► [API Response]

```

1. **LLM Interpreter:** Parses 1–3 unstructured operator notes into structured JSON via OpenRouter (`deepseek/deepseek-v4-flash-0731:free`).


2. **Deterministic Guardrails:** Sanitizes and validates LLM output against strict schema rules (indexes, ascending hour ranges `0–23`, and factor bounds `0–1`). Malformed outputs safely degrade to `no_op`.


3. **Math Optimizer:** Solves exact dynamic programming over hour-by-battery states to minimize total grid electricity cost (`total_cost_bdt`).


4. **Replay Validator:** Independently verifies energy balances, effective solar limits, battery bounds, and end-of-day neutrality before returning HTTP `200`.



---

## Quickstart (Local Execution)

Requires **Go 1.22+** and **Docker** (optional fallback).

### 1. Clone & Configure

```bash
git clone [https://github.com/Twaha-Rahman/bup-hackathon-submission](https://github.com/Twaha-Rahman/bup-hackathon-submission)
cd bup-hackathon-submission

cp .env.example .env
# Edit .env and set your OPENROUTER_API_KEY

```

### 2. Run Locally

```bash
# Run directly with Go
go run .

# OR build and run binary
go build -o server .
./server

```

*(The server binds to `0.0.0.0:3000` by default)*

### 3. Docker Fallback Execution

```bash
docker build -t gridwise .
docker run -d -p 3000:3000 --env-file .env --name gridwise-container gridwise

```

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | **Yes**<br> | OpenRouter API key for live note interpretation |
| `PORT` | No (Default: `3000`)

 | Server listening port |

---

## API Endpoints & Contract

### 1. Health Check

* **Method:** `GET /health`
* **Response (`200 OK`):**
```json
{"status": "ok"}

```



### 2. Energy Optimization

* **Method:** `POST /optimize-energy`
* **Content-Type:** `application/json`
* **Sample Request:**
```bash
curl -s http://localhost:3000/optimize-energy \
  -H 'Content-Type: application/json' \
  -d '{
    "scenario_id": "GRID-101",
    "operator_notes": ["Solar output will drop to about 20% from 1 PM to 3 PM."],
    "hours": [{"hour": 0, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 7}],
    "battery": {"capacity_kwh": 500, "initial_energy_kwh": 200, "minimum_energy_kwh": 50, "max_charge_kwh_per_hour": 100, "max_discharge_kwh_per_hour": 100}
  }'

```



---

## Public Sample Validation

To test your local deployment against all public reference cases:

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
    print(c['id'], 'interp_match=', got == want, 'cost=%.1f ref=%.1f' % (out['total_cost_bdt'], exp['total_cost_bdt']))
EOF

```

---

## Tech Stack & Limitations

* **Tech Stack:** Go 1.22+ Standard Library only (Zero external web frameworks or solver dependencies).


* **LLM Model:** OpenRouter (`deepseek/deepseek-v4-flash-0731:free`), reasoning enabled, pinned to `open-inference/fp8`.


* **Known Limitations:**
* The DP solver quantizes battery energy at 0.5 kWh steps (with a 0.25 kWh fallback). Scenarios with high-precision fractional initial energy values may be rejected.
* Infeasible or contradictory hard directives return a controlled HTTP `500` error response with no stack trace leakage.





```

```