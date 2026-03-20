# inteliflete-statistics

## Purpose

This lambda computes and stores carrier performance statistics for business intelligence purposes. Its sole responsibility is to aggregate operational data and persist calculated metrics that downstream services use for routing optimization and performance monitoring. It contains no business logic beyond data aggregation and metric storage.

## What it does

It executes scheduled aggregation queries against the operational database to compute three categories of carrier statistics: return rates by geographic region, delivery time averages between origin and destination cities, and carrier performance broken down by payment method. The computed metrics are stored in a key-value database with keys structured for efficient lookup by carrier and category. These statistics inform routing decisions and help identify carriers with higher return rates or longer delivery times.

## Statistics computation flow

1. Extracts the execution environment from the request context.
2. Queries the database for return statistics grouped by state, including only carriers with sufficient order volume.
3. Queries the database for return statistics grouped by city, applying the same minimum order threshold.
4. Queries the database for average delivery time between origin and destination city pairs.
5. For each state-level result, creates a statistics record with the carrier identifier, payment method grouping, state name, order counts, and calculated return percentage.
6. For each city-level result, creates a statistics record with the carrier identifier, payment method grouping, city identifier, order counts, and return percentage.
7. For each origin-destination result, creates a statistics record with the carrier identifier, payment method, city pair identifiers, average delivery time in hours, and total order count.
8. Stores all computed statistics in the key-value database.
9. Logs the total number of statistics records updated.

## Context stored on success

When statistics are updated, the system stores:

- Return rate metrics by carrier, state, and payment method.
- Return rate metrics by carrier, city, and payment method.
- Average delivery time metrics by carrier, payment method, and city pair.

## Internal layers

- **index**: entry point. Validates configuration, extracts the environment, and triggers the statistics update.
- **model**: holds all computation logic — parallel execution of aggregation queries, metric calculation, and result storage orchestration.
- **dao**: data access layer. Executes aggregation queries against the relational database and stores results in the key-value store.
- **dto**: handles data transformation. Extracts the environment parameter from the request context.
- **types**: defines internal constants for statistic categories and return thresholds.
- **utils**: helper functions for date formatting.
