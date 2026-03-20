## 1. Preparation

- [x] 1.1 Read b2c-auth/README.md to internalize the canonical style
- [x] 1.2 Read the current README for b2b-auth to identify gaps vs. canonical style
- [x] 1.3 Create a quick-reference checklist from the spec requirements for validation

## 2. Authentication Lambdas

- [x] 2.1 Rewrite b2b-auth/README.md to match canonical style
- [x] 2.2 Validate b2b-auth README against spec requirements

## 3. Mastershop Lambdas

- [x] 3.1 Rewrite Mastershop-UpdateOrders/README.md to match canonical style
- [x] 3.2 Rewrite Mastershop-Preload-Customer-Statistic/README.md to match canonical style
- [x] 3.3 Rewrite Mastershop-GenerateIn voiceStatementGMF/README.md to match canonical style
- [x] 3.4 Rewrite Mastershop-ProductApprovalAIReviewer/README.md to match canonical style
- [x] 3.5 Rewrite Mastershop-shopifyDataNormalizer/README.md to match canonical style
- [x] 3.6 Rewrite processAdditionalStepsInOrdersUpdate/README.md to match canonical style
- [x] 3.7 Validate all Mastershop READMEs against spec requirements

## 4. Reconciliation Lambdas

- [x] 4.1 Rewrite reconciliation-mastershop-orderReconciliationAnomalyChecker/README.md to match canonical style
- [x] 4.2 Rewrite reconciliation-mastershop-loadItemsToQueueReconciliationProcess/README.md to match canonical style
- [x] 4.3 Rewrite reconciliation-checkReconciliationDocumentAndLoadItemsToDb/README.md to match canonical style
- [x] 4.4 Validate all reconciliation READMEs against spec requirements

## 5. Remaining Lambdas

- [x] 5.1 Rewrite inteliflete-statistics/README.md to match canonical style
- [x] 5.2 Rewrite MasterShop-handleShipmentStatusUpdatesCoordinadora/README.md to match canonical style
- [x] 5.3 Rewrite MasterShop-handleShipmentUpdatesCoordinadora/README.md to match canonical style
- [x] 5.4 Rewrite blacklist-monitor-wallet/README.md to match canonical style
- [x] 5.5 Validate all remaining READMEs against spec requirements

## 6. Final Review

- [x] 6.1 Verify all 14 READMEs are rewritten and no original implementation-heavy READMEs remain
- [x] 6.2 Verify no internal identifiers (variables, tables, paths, etc.) are present in any README
- [x] 6.3 Verify each README uses the canonical section structure with correct ordering
- [x] 6.4 Verify flow section titles are domain-specific (not generic)
- [x] 6.5 Verify internal layers section maps every source file to its conceptual role
