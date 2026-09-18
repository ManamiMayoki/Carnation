import { Router } from "express";
import { getHealth, postAnalyzeTicket } from "../controllers/ticketController.js";

const router = Router();

router.get("/health", getHealth);
router.post("/analyze-ticket", postAnalyzeTicket);

export default router;