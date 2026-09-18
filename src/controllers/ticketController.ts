import { Request, Response } from "express";
import { AnalyzeTicketSchema } from "../schemas/ticketSchema.js";
import { investigateTicket } from "../services/aiInvestigator.js";

export const getHealth = (req: Request, res: Response): void => {
  res.status(200).json({ status: "ok" });
};

export const postAnalyzeTicket = async (req: Request, res: Response): Promise<Response> => {
  try {
    const validation = AnalyzeTicketSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Malformed or invalid input schema",
        details: validation.error.format(),
      });
    }

    const result = await investigateTicket(validation.data);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({ error: "Internal server error during analysis." });
  }
};