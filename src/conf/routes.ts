import { Router } from "express";

import { handler as auth } from "../lambdas/b2c-auth/index";
import { handler as blacklistMonitorWallet } from "../lambdas/blacklist-monitor-wallet/index";
import { handler as example } from "../lambdas/example/index";
import { handler as intelifleteStatistics } from "../lambdas/inteliflete-statistics/index";
import { jsonResponse } from "./middlewares";

const router = Router();

router.post("/example", jsonResponse({ handler: example }));

router.post(
  "/blacklist-monitor-wallet",
  jsonResponse({ handler: blacklistMonitorWallet })
);

router.post(
  "/inteliflete-statistics",
  jsonResponse({ handler: intelifleteStatistics })
);

router.post("/auth", jsonResponse({ handler: auth, customResponse: true }));

export default router;
