import { z } from "zod";

export const AnalyzeTicketSchema = z.object({

  ticket_id: z.string(),
  complaint: z.string(),
  language: z.enum(["en", "bn", "mixed"]).optional(),
  channel: z.string().optional(),
  user_type: z.string().optional(),
  campaign_context: z.string().optional(),
  transaction_history: z.array(
    
    z.object({
      transaction_id: z.string(),
      timestamp: z.string(),
      type: z.string(),
      amount: z.number(),
      counterparty: z.string(),
      status: z.string(),
    })
  ).optional(),
});

export type AnalyzeTicketInput = z.infer<typeof AnalyzeTicketSchema>;