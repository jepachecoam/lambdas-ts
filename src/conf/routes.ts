import { Router } from "express";

import { handler as b2bAuth } from "../lambdas/b2b-auth/index";
import { handler as b2cAuth } from "../lambdas/b2c-auth/index";
import { handler as blacklistMonitorWallet } from "../lambdas/blacklist-monitor-wallet/index";
import { handler as getReconciliationDocumentAndLoadItems } from "../lambdas/checkReconciliationDocumentAndLoadItems/index";
import { handler as example } from "../lambdas/example/index";
import { handler as intelifleteStatistics } from "../lambdas/inteliflete-statistics/index";
import { handler as loadItemsToQueueReconciliationProcess } from "../lambdas/loadItemsToQueueReconciliationProcess/index";
import { handler as orderReconciliationAnomalyChecker } from "../lambdas/orderReconciliationAnomalyChecker/index";
import { handler as processAdditionalStepsInOrdersUpdate } from "../lambdas/processAdditionalStepsInOrdersUpdate/index";
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

router.post(
  "/b2c-auth",
  jsonResponse({ handler: b2cAuth, customResponse: true })
);

router.post(
  "/b2b-auth",
  jsonResponse({ handler: b2bAuth, customResponse: true })
);

router.post(
  "/process-additional-steps-in-orders-update",
  jsonResponse({ handler: processAdditionalStepsInOrdersUpdate })
);

router.post(
  "/check-reconciliation-document-and-load-items",
  jsonResponse({ handler: getReconciliationDocumentAndLoadItems })
);

router.post(
  "/order-reconciliation-anomaly-checker",
  jsonResponse({ handler: orderReconciliationAnomalyChecker })
);

router.post(
  "/load-items-to-queue-reconciliation-process",
  jsonResponse({ handler: loadItemsToQueueReconciliationProcess })
);

export default router;
