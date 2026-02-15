import { Router } from "express";

const router = Router();

import { initializeChat, saveChat, getChat } from "../controller/chat";

router.get("/", (req, res) => {
  res.json({ message: "Hello from Chatbot!" });
});


router.get("/initialize-chat", initializeChat);
router.post("/save-chat", saveChat);
router.post("/get-chat", getChat);



export default router;
