# Carnation - QueueStorm Investigator API

An AI-powered support operations copilot built for the SUST CSE Carnival Hackathon. It analyzes customer digital finance complaints against transaction histories, performs evidence validation, routes cases, and enforces strict security guardrails.

## Tech Stack
* **Runtime:** Node.js & Express
* **Language:** TypeScript
* **Validation:** Zod
* **AI Model:** OpenAI GPT-4o-mini

## Setup & Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/ManamiMayoki/Carnation.git
   cd CARNATION
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure environment variables:
   Create a \`.env\` file in the root directory and add:
   \`\`\`env
   PORT=3000
   OPENAI_API_KEY=your_actual_openai_key_here
   \`\`\`

## Running the Service

* **Development mode:**
  \`\`\`bash
  npx ts-node src/server.ts
  \`\`\`

## API Endpoints
* \`GET /health\` - Returns service health status (\`{"status": "ok"}\`)[cite: 5]
* \`POST /analyze-ticket\` - Accepts a customer ticket JSON body and returns structured investigation results.

## AI Approach & Safety Logic
* **Evidence Investigation:** Compares customer complaints with recent transaction history arrays to flag consistency (`consistent`, `inconsistent`, `insufficient_data`)[cite: 5].
* **Safety Guardrails:** Enforces strict regex/keyword filters to ensure the model *never* asks for a PIN, OTP, or password, and blocks unauthorized refund confirmations[cite: 5].