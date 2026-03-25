# MasterShop-Update-shippingRateBilled

## Description

> TODO: describe what this lambda does.

## Trigger

**HTTP / API Gateway**

This lambda is triggered via HTTP (API Gateway). On error it returns a `500` response.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ENVIRONMENT` | Deployment stage: `dev`, `qa`, or `prod` | Yes |
| `DB_HOST_<STAGE>` | MySQL primary host | Yes |
| `DB_HOST_READ_ONLY_<STAGE>` | MySQL read-replica host | Yes |
| `DB_NAME_<STAGE>` | Database name | Yes |
| `DB_USER_<STAGE>` | Database user | Yes |
| `DB_PASSWORD_<STAGE>` | Database password | Yes |

> Add any lambda-specific env vars to `types.ts → EnvsEnum` and `conf/envs.ts`.

## Local Dev Endpoint

```
POST http://localhost:3000/master-shop-update-shipping-rate-billed
```

Example payload:

```json
{
  "idOrder": 1
}
```

## Deploy

```bash
npm run build
# Select: MasterShop-Update-shippingRateBilled
```

The build outputs a single `dist/index.js` ready to upload to AWS Lambda.

## Architecture

| File | Layer | Responsibility |
|------|-------|---------------|
| `index.ts` | Handler | Entry point, env check, param extraction, model call |
| `model.ts` | Business Logic | Orchestrates workflow, coordinates DAO calls |
| `dao.ts` | Data Access | All DB / HTTP / AWS SDK calls |
| `dto.ts` | Data Transformation | Parse and validate input via Zod |
| `types.ts` | Types | Interfaces, enums, Zod schemas |
| `conf/envs.ts` | Env Config | Eagerly-loaded env var constants |
