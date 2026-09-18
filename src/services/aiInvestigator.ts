import OpenAI from "openai";
import dotenv from "dotenv";
import { AnalyzeTicketInput } from "../schemas/ticketSchema.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function investigateTicket(data: AnalyzeTicketInput) {
  const systemPrompt = `
You are an expert AI support operations copilot for a digital finance company (bKash style).
Your task is to analyze a customer complaint alongside their recent transaction history.
You must determine if the evidence supports the complaint, classify the case, route it, and write a safe response.

CRITICAL SAFETY RULES:
1. NEVER ask the customer for their PIN, OTP, password, or full card number under any circumstances, even as a verification step. Violation results in automatic failure.
2. NEVER confirm a refund, reversal, or account unblock directly (use phrasing like "any eligible amount will be returned through official channels" instead of "we will refund you").

You must return a raw JSON object matching this exact structure (no markdown code blocks, just raw JSON):
{
  "ticket_id": "${data.ticket_id}",
  "relevant_transaction_id": "string or null",
  "evidence_verdict": "consistent | inconsistent | insufficient_data",
  "case_type": "wrong_transfer | payment_failed | refund_request | duplicate_payment | merchant_settlement_delay | agent_cash_in_issue | phishing_or_social_engineering | other",
  "severity": "low | medium | high | critical",
  "department": "customer_support | dispute_resolution | payments_ops | merchant_operations | agent_operations | fraud_risk",
  "agent_summary": "1-2 sentences summarizing the case",
  "recommended_next_action": "Operational step for agent",
  "customer_reply": "Safe official reply text following safety rules",
  "human_review_required": true,
  "confidence": 0.95,
  "reason_codes": ["array", "of", "short", "tags"]
}
`;

  const userPrompt = JSON.stringify(data);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("Failed to generate AI response");

  const parsedResult = JSON.parse(content);

  // Hardcode safety net filter guardrail for customer reply
  const unsafeKeywords = ["pin", "otp", "password", "card number"];
  const replyLower = parsedResult.customer_reply.toLowerCase();
  for (const word of unsafeKeywords) {
    if (replyLower.includes(word)) {
      parsedResult.customer_reply = "We have received your query regarding your account. Please contact our official support hotline directly for secure assistance.";
      parsedResult.human_review_required = true;
    }
  }

  return parsedResult;
}