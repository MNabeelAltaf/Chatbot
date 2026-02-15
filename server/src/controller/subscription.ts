import { Request, Response } from "express";
import { subscriptionPlanModel, purchaseSubscriptionModel, cancelSubscriptionModel } from "../model/subscription";

export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionPlanModel();
    res.status(200).json({ success: true, data: plans });
  } catch (err: any) {
    console.error("Error fetching subscription plans:", err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
};



export const purchaseSubscription = async (req: Request, res: Response) => {
  try {
    const { user_id, chat_token, subscription_id, auto_renew, card_number, cvc, card_expiry_date } = req.body;

  
    if (!user_id || !chat_token || !subscription_id || auto_renew === undefined || !card_number || !cvc || !card_expiry_date) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }


    const result = await purchaseSubscriptionModel({
      user_id: Number(user_id),
      chat_token,
      subscription_id: Number(subscription_id),
      auto_renew,
      card_number,
      cvc: Number(cvc),
      card_expiry_date,
    });

    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    console.error("Error purchasing subscription plan:", err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
};





export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { user_id, chat_token } = req.body;
    if (!user_id || !chat_token) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const result = await cancelSubscriptionModel({ user_id, chat_token });

    res.status(200).json({ success: true, message: "Subscription canceled successfully", data: result });
  } catch (err: any) {
    console.error("Error canceling subscription:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
