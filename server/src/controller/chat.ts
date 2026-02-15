import { Request, Response } from "express";
import { createChatUser , saveChatModel, getChatModel} from "../model/chat";

export const initializeChat = async (req: Request, res: Response) => {
  try {
    const data = await createChatUser();
    res.status(200).json({
      success: true,
      message: "Chat initialized successfully!",
      data,
    });
  } catch (err) {
    console.error("Error :", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


export const saveChat = async (req: Request, res: Response) => {
  try {
    const { user_id, chat_token, question, answer } = req.body;

    if (!user_id || !chat_token || !question || !answer) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const data = await saveChatModel({ user_id, chat_token, question, answer });

    res.status(200).json({
      success: true,
      message: "Chat saved successfully!",
      data, 
    });
  } catch (err: any) {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
};


export const getChat = async (req: Request, res: Response) => {
  try {
    const { user_id, chat_token } = req.body;

    if (!user_id || !chat_token) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const chats = await getChatModel({ user_id, chat_token });

    res.status(200).json({
      success: true,
      message: "Chat retrieved successfully!",
      chats, 
    });
  } catch (err: any) {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
};


