import { Router } from "express";

const router = Router();

import { getSettings, getDetailedSettings , updateAutoRenew} from "../controller/settings";


router.post("/get-settings", getSettings);
router.post("/get-detailed-settings", getDetailedSettings);
router.post("/update-autorenew", updateAutoRenew);



export default router;
