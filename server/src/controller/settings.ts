import { Request, Response } from "express";
import { getSettingsModel, getDetailedSettingsModel, updateAutoRenewModel } from "../model/settings";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const { user_id, chat_token } = req.body;

    if (!user_id || !chat_token) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const data = await getSettingsModel({ user_id, chat_token });

    if (!data) {
      return res.status(404).json({ success: false, error: "Settings not found" });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("Error getting settings:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};




export const getDetailedSettings = async (req: Request, res: Response) => {
    try {
    const { user_id, chat_token } = req.body;

    if (!user_id || !chat_token) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const data = await getDetailedSettingsModel({ user_id, chat_token });

    if (!data) {
      return res.status(404).json({ success: false, error: "Settings not found" });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("Error getting settings with payments:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



export const updateAutoRenew = async (req: Request, res: Response) => {
  try {
    const { user_id, chat_token, subscription_autorenewal } = req.body;

    if (user_id === undefined || !chat_token || subscription_autorenewal === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const updated = await updateAutoRenewModel({ user_id, chat_token, subscription_autorenewal });
    

    if (!updated) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    res.status(200).json({
      success: true,
      message: `Auto-renew ${subscription_autorenewal ? "enabled" : "disabled"} successfully`,
    });
  } catch (err) {
    console.error("Error updating auto-renew:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

