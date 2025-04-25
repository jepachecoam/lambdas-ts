import { Router } from "express";

import { handler as auth } from "../lambdas/auth/index";
import { handler as blacklistMonitorWallet } from "../lambdas/blacklist-monitor-wallet/index";
import { handler as example } from "../lambdas/example/index";
import { handler as intelifleteStatistics } from "../lambdas/inteliflete-statistics/index";
import { jsonResponse } from "./middlewares";

const router = Router();

router.post("/example", jsonResponse(example));
router.post("/blacklist-monitor-wallet", jsonResponse(blacklistMonitorWallet));
router.post("/inteliflete-statistics", jsonResponse(intelifleteStatistics));
router.post("/auth", jsonResponse(auth));

export default router;
