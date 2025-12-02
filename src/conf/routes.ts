import { Router } from "express";

import { handler as b2bAuth } from "../lambdas/b2b-auth/index";
import { handler as b2cAuth } from "../lambdas/b2c-auth/index";
import { handler as blacklistMonitorWallet } from "../lambdas/blacklist-monitor-wallet/index";
import { handler as example } from "../lambdas/example/index";
import { handler as intelifleteStatistics } from "../lambdas/inteliflete-statistics/index";
import { handler as customerStatistics } from "../lambdas/Mastershop-Customer-Statistic/index";
import { handler as customerDeduplicationJob } from "../lambdas/Mastershop-CustomerDeduplicationJob/index";
import { handler as customerDeduplicationProcess } from "../lambdas/Mastershop-CustomerDeduplicationProcess/index";
import { handler as generateInvoiceStatementGMF } from "../lambdas/Mastershop-GenerateInvoiceStatementGMF";
import { handler as handleShipmentStatusUpdatesCoordinadora } from "../lambdas/MasterShop-handleShipmentStatusUpdatesCoordinadora/index";
import { handler as ordersMonitor } from "../lambdas/MasterShop-OrdersMonitor/index";
import { handler as productApprovalBasicValidations } from "../lambdas/MasterShop-ProductApproval-BasicValidations/index";
import { handler as productApprovalFinishValidation } from "../lambdas/MasterShop-ProductApproval-FinishValidation";
import { handler as bedrockIntegration } from "../lambdas/Mastershop-ProductApprovalAIReviewer/index";
import { handler as shopifyDataNormalizer } from "../lambdas/Mastershop-shopifyDataNormalizer";
import { handler as updateOrders } from "../lambdas/Mastershop-UpdateOrders/index";
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
  "/bedrock",
  serverResponse({ handler: bedrockIntegration, responseType: "http" })
);

router.post(
  "/customer-statistics",
  serverResponse({ handler: customerStatistics, responseType: "http" })
);

router.post(
  "/generate-invoice-statement-gmf",
  serverResponse({ handler: generateInvoiceStatementGMF, responseType: "http" })
);

router.post(
  "/customer-deduplication-job",
  serverResponse({ handler: customerDeduplicationJob, responseType: "http" })
);

router.post(
  "/customer-deduplication-process",
  serverResponse({
    handler: customerDeduplicationProcess,
    responseType: "http"
  })
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

router.post(
  "/shopify-data-normalizer",
  serverResponse({
    handler: shopifyDataNormalizer,
    responseType: "http"
  })
);

router.post(
  "/orders-monitor",
  serverResponse({
    handler: ordersMonitor,
    responseType: "http"
  })
);

router.post(
  "/update-orders",
  serverResponse({
    handler: updateOrders,
    responseType: "http"
  })
);

router.post(
  "/product-approval-basic-validations",
  serverResponse({
    handler: productApprovalBasicValidations,
    responseType: "http"
  })
);

router.post(
  "/product-approval-finish-validation",
  serverResponse({
    handler: productApprovalFinishValidation,
    responseType: "http"
  })
);

export default router;
