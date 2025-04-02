import { Router } from "express";

import { handler as blacklistMonitorWallet } from "../lambdas/blacklist-monitor-wallet/index";
import { handler as example } from "../lambdas/example/index";
import { handler as intelifleteStatistics } from "../lambdas/inteliflete-statistics/index";
import { jsonResponse } from "./middlewares/index";

const router = Router();

router.post("/example", jsonResponse(example));
router.post("/blacklist-monitor-wallet", jsonResponse(blacklistMonitorWallet));
router.post("/inteliflete-statistics", jsonResponse(intelifleteStatistics));

export default router;
