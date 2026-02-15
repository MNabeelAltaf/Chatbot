import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat";
import subscriptionRoutes from "./routes/subscription";
import settingRoutes from "./routes/settings";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

app.use("/api", chatRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/settings", settingRoutes);


app.listen(PORT, () => {
  console.log(`Local Server running on http://localhost:${PORT}`);
});
