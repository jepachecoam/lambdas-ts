import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ─── Constants ───────────────────────────────────────────────────────────────

const LAMBDAS_DIR = path.resolve(__dirname, "../src/lambdas");
const ROUTES_FILE = path.resolve(__dirname, "../src/conf/routes.ts");

type TriggerType = "http" | "sqs";
type ResponseType = "http" | "excel" | "pdf" | "void";

interface LambdaConfig {
  name: string;
  trigger: TriggerType;
  routePath: string;
  responseType: ResponseType;
}

// ─── CLI helpers ─────────────────────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question: string): Promise<string> =>
  new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer.trim()))
  );

const askChoice = async <T extends string>(
  question: string,
  choices: { label: string; value: T }[]
): Promise<T> => {
  const lines = choices.map((c, i) => `  ${i + 1}. ${c.label}`).join("\n");
  let selected: T | undefined;
  while (selected === undefined) {
    const answer = await ask(`${question}\n${lines}\n> `);
    const index = parseInt(answer, 10) - 1;
    if (index >= 0 && index < choices.length) {
      selected = choices[index].value;
    } else {
      console.log(`  Please enter a number between 1 and ${choices.length}.`);
    }
  }
  return selected;
};

// ─── Name utilities ───────────────────────────────────────────────────────────

/** "Mastershop-OrderProcessor" → "mastershopOrderProcessorHandler" */
const toHandlerAlias = (lambdaName: string): string => {
  const parts = lambdaName
    .replace(/[_\s]+/g, "-")
    .split("-")
    .filter(Boolean);

  const camel = parts
    .map((p, i) =>
      i === 0
        ? p.charAt(0).toLowerCase() + p.slice(1)
        : p.charAt(0).toUpperCase() + p.slice(1)
    )
    .join("");

  return `${camel}Handler`;
};

/** "Mastershop-OrderProcessor" → "mastershop-order-processor" (for route suggestion) */
const toKebabCase = (lambdaName: string): string =>
  lambdaName
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();

// ─── File generators ─────────────────────────────────────────────────────────

const genTypes = (name: string): string => `import { z } from "zod";

// Lambda-specific env var keys (NOT DB vars — those come from shared dbEnv)
export enum EnvsEnum {
  ENVIRONMENT = "ENVIRONMENT"
  // BASE_URL_MS = "BASE_URL_MS",
  // API_KEY_MS  = "API_KEY_MS",
}

// Zod schema for validating the incoming event payload
export const inputSchema = z.object({
  idOrder: z.number().int().positive()
});

// TypeScript type inferred from Zod schema
export type IInputSchema = z.infer<typeof inputSchema>;

// Domain interfaces for DAO return shapes / Model params
export interface IProcessInput {
  idOrder: number;
}

export interface IProcessResult {
  success: boolean;
  message: string;
}
`;

const genEnvs = (): string => `import { EnvsEnum } from "../types";

export const envs = {
  ENVIRONMENT: process.env[EnvsEnum.ENVIRONMENT]!
  // BASE_URL_MS: process.env[EnvsEnum.BASE_URL_MS]!,
  // API_KEY_MS:  process.env[EnvsEnum.API_KEY_MS]!,
};
`;

const genDao =
  (): string => `import Database from "../../shared/databases/sequelize";
// import { CacheDB }        from "../../shared/databases/cache";
// import Dynamo             from "../../shared/databases/dynamo";
// import { b2bRequest }     from "../../shared/services/httpRequest";
// import SecretManager      from "../../shared/services/secretManager";
import { IProcessResult } from "./types";

class Dao {
  private environment: string;
  private db: Database;

  constructor(environment: string) {
    this.environment = environment;
    this.db = new Database(environment);
  }

  fetchRecord = async (idOrder: number): Promise<IProcessResult | null> => {
    try {
      const result = await this.db.fetchOne(
        "SELECT id, status FROM \`order\` WHERE idOrder = :idOrder LIMIT 1",
        { replacements: { idOrder } }
      );
      return result ?? null;
    } catch (error) {
      console.error("Error in Dao.fetchRecord:", error);
      throw error;
    }
  };

  // Idempotent INSERT pattern example:
  // insertRecordIfNotExists = async (idOrder: number): Promise<boolean | null> => {
  //   try {
  //     return await this.db.insert(
  //       \`INSERT INTO example_table (idOrder, createdAt)
  //        SELECT :idOrder, NOW()
  //        WHERE NOT EXISTS (
  //          SELECT 1 FROM example_table WHERE idOrder = :idOrder
  //        )\`,
  //       { replacements: { idOrder } }
  //     );
  //   } catch (error) {
  //     console.error("Error in Dao.insertRecordIfNotExists:", error);
  //     throw error;
  //   }
  // };
}

export default Dao;
`;

const genDto =
  (): string => `import { inputSchema, IProcessInput } from "./types";

const extractParams = (event: any): IProcessInput => {
  const body = typeof event.body === "string" ? JSON.parse(event.body) : event;

  const result = inputSchema.safeParse(body);

  if (!result.success) {
    console.error("Invalid input:", result.error);
    throw new Error(\`Invalid input: \${result.error.message}\`);
  }

  return result.data;
};

export default {
  extractParams
};
`;

const genModel = (): string => `import Dao from "./dao";
import { IProcessInput, IProcessResult } from "./types";

class Model {
  private environment: string;
  private dao: Dao;

  constructor(environment: string) {
    this.environment = environment;
    this.dao = new Dao(environment);
  }

  process = async (params: IProcessInput): Promise<IProcessResult> => {
    try {
      console.log("Model.process params:", params);

      const record = await this.dao.fetchRecord(params.idOrder);

      if (!record) {
        throw new Error(\`Record not found for idOrder: \${params.idOrder}\`);
      }

      // Add business logic here.
      // Example of parallel batch with isolation:
      //
      // const results = await Promise.allSettled(
      //   items.map((item) => this.processOne(item))
      // );
      // const failures = results.filter((r) => r.status === "rejected");
      // if (failures.length > 0) {
      //   console.error("Some items failed:", failures);
      // }

      return { success: true, message: "Processed successfully" };
    } catch (error) {
      console.error("Error in Model.process:", error);
      throw error;
    }
  };
}

export default Model;
`;

const genIndexHttp =
  (): string => `import httpResponse from "../../shared/responses/http";
import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import { envs } from "./conf/envs";
import dto from "./dto";
import Model from "./model";
import { EnvsEnum } from "./types";

export const handler = async (event: any, _context: any) => {
  console.log("Event :>>>", JSON.stringify(event));

  try {
    checkEnv({ ...EnvsEnum, ...dbEnv });

    const model = new Model(envs.ENVIRONMENT);
    const params = dto.extractParams(event);
    const result = await model.process(params);

    console.log("Result =>>>", result);

    return httpResponse({ statusCode: 200, body: result });
  } catch (err) {
    console.error("Error in handler", err);
    return httpResponse({ statusCode: 500, body: err });
  }
};
`;

const genIndexSqs =
  (): string => `import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import { envs } from "./conf/envs";
import dto from "./dto";
import Model from "./model";
import { EnvsEnum } from "./types";

export const handler = async (event: any, _context: any) => {
  console.log("Event :>>>", JSON.stringify(event));

  try {
    checkEnv({ ...EnvsEnum, ...dbEnv });

    const model = new Model(envs.ENVIRONMENT);

    // SQS events contain a Records array. Process each message independently.
    const records: any[] = event.Records ?? [event];

    const results = await Promise.allSettled(
      records.map(async (record) => {
        const body = typeof record.body === "string" ? JSON.parse(record.body) : record;
        const params = dto.extractParams(body);
        return model.process(params);
      })
    );

    const failures = results.filter((r) => r.status === "rejected");

    if (failures.length > 0) {
      console.error("Some SQS records failed:", failures);
      // Throwing causes failed messages to return to the queue for retry.
      throw new Error(\`\${failures.length} record(s) failed processing\`);
    }

    console.log("Result =>>>", results);
  } catch (err) {
    console.error("Error in handler", err);
    // SQS lambdas must throw so the message returns to the queue.
    throw err;
  }
};
`;

const genReadme = (
  name: string,
  trigger: TriggerType,
  routePath: string
): string => {
  const triggerLabel = trigger === "sqs" ? "AWS SQS" : "HTTP / API Gateway";
  const triggerNote =
    trigger === "sqs"
      ? "This lambda is triggered by an SQS queue. On failure it **throws** so the message is returned to the queue for retry (at-least-once delivery)."
      : "This lambda is triggered via HTTP (API Gateway). On error it returns a `500` response.";

  return `# ${name}

## Description

> TODO: describe what this lambda does.

## Trigger

**${triggerLabel}**

${triggerNote}

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| \`ENVIRONMENT\` | Deployment stage: \`dev\`, \`qa\`, or \`prod\` | Yes |
| \`DB_HOST_<STAGE>\` | MySQL primary host | Yes |
| \`DB_HOST_READ_ONLY_<STAGE>\` | MySQL read-replica host | Yes |
| \`DB_NAME_<STAGE>\` | Database name | Yes |
| \`DB_USER_<STAGE>\` | Database user | Yes |
| \`DB_PASSWORD_<STAGE>\` | Database password | Yes |

> Add any lambda-specific env vars to \`types.ts → EnvsEnum\` and \`conf/envs.ts\`.

## Local Dev Endpoint

\`\`\`
POST http://localhost:3000${routePath}
\`\`\`

Example payload:

\`\`\`json
{
  "idOrder": 1
}
\`\`\`

## Deploy

\`\`\`bash
npm run build
# Select: ${name}
\`\`\`

The build outputs a single \`dist/index.js\` ready to upload to AWS Lambda.

## Architecture

| File | Layer | Responsibility |
|------|-------|---------------|
| \`index.ts\` | Handler | Entry point, env check, param extraction, model call |
| \`model.ts\` | Business Logic | Orchestrates workflow, coordinates DAO calls |
| \`dao.ts\` | Data Access | All DB / HTTP / AWS SDK calls |
| \`dto.ts\` | Data Transformation | Parse and validate input via Zod |
| \`types.ts\` | Types | Interfaces, enums, Zod schemas |
| \`conf/envs.ts\` | Env Config | Eagerly-loaded env var constants |
`;
};

// ─── routes.ts patcher ───────────────────────────────────────────────────────

const patchRoutes = (config: LambdaConfig): void => {
  const { name, routePath, responseType } = config;
  const alias = toHandlerAlias(name);
  const importLine = `import { handler as ${alias} } from "../lambdas/${name}/index";`;

  const routeBlock =
    "\nrouter.post(\n" +
    `  "${routePath}",\n` +
    `  serverResponse({ handler: ${alias}, responseType: "${responseType}" })\n` +
    ");\n";

  let content = fs.readFileSync(ROUTES_FILE, "utf-8");

  // Insert import after the last existing lambda import (before `import { serverResponse }`)
  const serverResponseImportMarker =
    'import { serverResponse } from "./middlewares";';
  if (!content.includes(importLine)) {
    content = content.replace(
      serverResponseImportMarker,
      `${importLine}\n${serverResponseImportMarker}`
    );
  }

  // Insert route block just before `export default router;`
  const exportMarker = "export default router;";
  content = content.replace(exportMarker, `${routeBlock}${exportMarker}`);

  fs.writeFileSync(ROUTES_FILE, content, "utf-8");
};

// ─── File writer ─────────────────────────────────────────────────────────────

const writeFile = (filePath: string, content: string): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`  created  ${path.relative(process.cwd(), filePath)}`);
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  console.log("\n========================================");
  console.log("  Lambda Creator — BeMaster Lambdas TS  ");
  console.log("========================================\n");

  // 1. Lambda name
  let lambdaName = "";
  while (!lambdaName) {
    lambdaName = await ask("Lambda name (e.g. Mastershop-OrderProcessor): ");
    if (!lambdaName) {
      console.log("  Name cannot be empty.");
    }
    const targetDir = path.join(LAMBDAS_DIR, lambdaName);
    if (fs.existsSync(targetDir)) {
      console.log(
        `  Error: a lambda named "${lambdaName}" already exists at ${targetDir}`
      );
      lambdaName = "";
    }
  }

  // 2. Trigger type
  const trigger = await askChoice<TriggerType>("Trigger type:", [
    { label: "HTTP / API Gateway", value: "http" },
    { label: "SQS", value: "sqs" }
  ]);

  // 3. Route path
  const defaultPath = `/${toKebabCase(lambdaName)}`;
  let routePath = await ask(
    `Route path for local dev server [${defaultPath}]: `
  );
  if (!routePath) routePath = defaultPath;
  if (!routePath.startsWith("/")) routePath = `/${routePath}`;

  // 4. Response type (only relevant for HTTP, but we still register all lambdas)
  const responseType = await askChoice<ResponseType>("Response type:", [
    { label: "http — returns { statusCode, body }", value: "http" },
    {
      label: "void — always returns 200 { result: 'processed' }",
      value: "void"
    },
    { label: "excel — decodes base64 body as Excel file", value: "excel" },
    { label: "pdf — decodes base64 body as PDF file", value: "pdf" }
  ]);

  const config: LambdaConfig = {
    name: lambdaName,
    trigger,
    routePath,
    responseType
  };

  // ── Generate files ──────────────────────────────────────────────────────────

  const lambdaDir = path.join(LAMBDAS_DIR, lambdaName);
  console.log(
    `\nCreating lambda at ${path.relative(process.cwd(), lambdaDir)}/\n`
  );

  writeFile(path.join(lambdaDir, "types.ts"), genTypes(lambdaName));
  writeFile(path.join(lambdaDir, "conf", "envs.ts"), genEnvs());
  writeFile(path.join(lambdaDir, "dao.ts"), genDao());
  writeFile(path.join(lambdaDir, "dto.ts"), genDto());
  writeFile(path.join(lambdaDir, "model.ts"), genModel());
  writeFile(
    path.join(lambdaDir, "index.ts"),
    trigger === "sqs" ? genIndexSqs() : genIndexHttp()
  );
  writeFile(
    path.join(lambdaDir, "README.md"),
    genReadme(lambdaName, trigger, routePath)
  );

  // ── Patch routes.ts ─────────────────────────────────────────────────────────

  console.log("\nRegistering route in src/conf/routes.ts ...");
  patchRoutes(config);
  console.log("  updated  src/conf/routes.ts");

  // ── Done ────────────────────────────────────────────────────────────────────

  console.log("\n========================================");
  console.log("  Lambda created successfully!");
  console.log("========================================");
  console.log(`
Next steps:
  1. Edit types.ts       — add your EnvsEnum keys, Zod schema and interfaces
  2. Edit conf/envs.ts   — load your new env vars
  3. Edit dao.ts         — implement your data access methods
  4. Edit dto.ts         — adjust extractParams to match your schema
  5. Edit model.ts       — implement your business logic
  6. Add env vars to .example.env
  7. Run: npm run dev    — test your route at POST http://localhost:3000${routePath}
`);

  rl.close();
};

main().catch((err) => {
  console.error("Fatal error:", err);
  rl.close();
  process.exit(1);
});
