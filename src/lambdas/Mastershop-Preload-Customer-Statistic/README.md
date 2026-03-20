# Mastershop-Preload-Customer-Statistic

## Purpose

This lambda preloads customer statistics into a distributed cache. Its sole responsibility is to fetch behavioral metrics for a batch of customers and store them in Redis for fast retrieval by downstream services. It contains no business logic beyond data aggregation and caching.

## What it does

It receives events containing customer phone numbers and their associated countries. For each unique phone-country pair, it queries the database to compute aggregate behavioral metrics including order volume, return rate, delivery success, cancellation count, and blocked business relationships. It stores the computed statistics in Redis with a thirty-day expiration, enabling downstream services to quickly access customer profiles without hitting the primary database.

## Processing flow

1. Parses the incoming event to extract customer phone numbers and their countries.
2. Deduplicates the phone-country pairs to avoid redundant lookups.
3. Separates records missing phone or country data for separate handling.
4. Groups the valid phone numbers by country for efficient batch querying.
5. For each country group, queries the database to compute customer statistics.
6. Stores each customer's statistics in Redis with a thirty-day TTL.
7. Logs any records that could not be processed due to missing data.

## Context cached on success

When customer statistics are preloaded, the cache is enriched with:

- Total number of orders placed by the customer.
- Number of orders that resulted in returns.
- Number of successfully delivered orders.
- Number of canceled orders.
- Count of distinct businesses that have blocked the customer.
- The customer's return rate as a percentage.

## Internal layers

- **index**: entry point. Initializes database and cache connections, parses the event, and delegates to the model.
- **model**: holds all business logic — event parsing, phone extraction and deduplication, statistic aggregation, and cache storage orchestration.
- **dao**: data access layer. Executes the aggregation queries against the primary database and stores the results in the cache.
- **dto**: handles data transformation. Extracts phone numbers and countries from events, normalizes phone formats, and structures the output for caching.
