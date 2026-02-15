import { Router } from "express";

const router = Router();

import { getSubscriptionPlans , purchaseSubscription, cancelSubscription} from "../controller/subscription";


router.get("/plans", getSubscriptionPlans);
router.post("/purchase", purchaseSubscription);
router.post("/cancel", cancelSubscription);



export default router;
