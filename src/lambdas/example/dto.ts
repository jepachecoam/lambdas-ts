// dto.ts — Data Transformation Layer
//
// Rules for this file:
//   - Parse and validate raw event input. Transform data. Shape responses.
//   - Export as a plain default object: `export default { ... }`
//   - NO class instantiation, NO DB calls, NO business logic.
//   - Use Zod safeParse() for validation — never throw on bad input without logging.

import { inputSchema, IProcessInput } from "./types";

// ---------------------------------------------------------------------------
// extractParams — called by index.ts to parse the raw Lambda event.
// Throws on validation failure so the handler catch block returns a 500.
// ---------------------------------------------------------------------------
const extractParams = (event: any): IProcessInput => {
  const body = typeof event.body === "string" ? JSON.parse(event.body) : event;

  const result = inputSchema.safeParse(body);

  if (!result.success) {
    console.error("Invalid input:", result.error);
    throw new Error(`Invalid input: ${result.error.message}`);
  }

  return result.data;
};

export default {
  extractParams
};
