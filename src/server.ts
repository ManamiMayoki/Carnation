import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/apiRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mount the API routes
app.use("/", apiRoutes);

app.listen(PORT, () => {
  console.log(`QueueStorm Investigator API running on port ${PORT}`);
});