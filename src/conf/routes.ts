import { Router } from "express";

import { handler as b2bAuth } from "../lambdas/b2b-auth/index";
import { handler as b2cAuth } from "../lambdas/b2c-auth/index";
import { handler as blacklistMonitorWallet } from "../lambdas/blacklist-monitor-wallet/index";
import { handler as example } from "../lambdas/example/index";
import { handler as intelifleteStatistics } from "../lambdas/inteliflete-statistics/index";
import { handler as handleShipmentStatusUpdatesCoordinadora } from "../lambdas/MasterShop-handleShipmentStatusUpdatesCoordinadora/index";
import { handler as processAdditionalStepsInOrdersUpdate } from "../lambdas/processAdditionalStepsInOrdersUpdate/index";
import { handler as getReconciliationDocumentAndLoadItems } from "../lambdas/reconciliation-checkReconciliationDocumentAndLoadItemsToDb/index";
import { handler as loadItemsToQueueReconciliationProcess } from "../lambdas/reconciliation-mastershop-loadItemsToQueueReconciliationProcess/index";
import { handler as orderReconciliationAnomalyChecker } from "../lambdas/reconciliation-mastershop-orderReconciliationAnomalyChecker/index";
import { serverResponse } from "./middlewares";

const router = Router();

router.post(
  "/example",
  serverResponse({ handler: example, responseType: "http" })
);

router.post(
  "/blacklist-monitor-wallet",
  serverResponse({ handler: blacklistMonitorWallet, responseType: "void" })
);

router.post(
  "/inteliflete-statistics",
  serverResponse({ handler: intelifleteStatistics, responseType: "void" })
);

router.post(
  "/b2c-auth",
  serverResponse({ handler: b2cAuth, responseType: "void" })
);

router.post(
  "/b2b-auth",
  serverResponse({ handler: b2bAuth, responseType: "void" })
);

router.post(
  "/process-additional-steps-in-orders-update",
  serverResponse({
    handler: processAdditionalStepsInOrdersUpdate,
    responseType: "void"
  })
);

router.post(
  "/check-reconciliation-document-and-load-items",
  serverResponse({
    handler: getReconciliationDocumentAndLoadItems,
    responseType: "void"
  })
);

router.post(
  "/order-reconciliation-anomaly-checker",
  serverResponse({
    handler: orderReconciliationAnomalyChecker,
    responseType: "void"
  })
);

router.post(
  "/load-items-to-queue-reconciliation-process",
  serverResponse({
    handler: loadItemsToQueueReconciliationProcess,
    responseType: "void"
  })
);

router.post(
  "/handle-shipment-status-updates-coordinadora",
  serverResponse({
    handler: handleShipmentStatusUpdatesCoordinadora,
    responseType: "http"
  })
);

export default router;
