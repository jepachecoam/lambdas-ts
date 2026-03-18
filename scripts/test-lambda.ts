import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ─── Constants ───────────────────────────────────────────────────────────────

const LAMBDAS_DIR = path.resolve(__dirname, "../src/lambdas");

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

// ─── Lambda discovery ─────────────────────────────────────────────────────────

const getLambdasWithTests = (): string[] => {
  if (!fs.existsSync(LAMBDAS_DIR)) {
    console.error(`Lambda directory not found: ${LAMBDAS_DIR}`);
    process.exit(1);
  }

  return fs
    .readdirSync(LAMBDAS_DIR)
    .filter((entry) => {
      const fullPath = path.join(LAMBDAS_DIR, entry);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort();
};

const hasTests = (lambdaName: string): boolean => {
  const testsDir = path.join(LAMBDAS_DIR, lambdaName, "__tests__");
  return (
    fs.existsSync(testsDir) &&
    fs.readdirSync(testsDir).some((f) => f.endsWith(".test.ts"))
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  console.log("\n========================================");
  console.log("   Lambda Test Runner — BeMaster TS    ");
  console.log("========================================\n");

  const allLambdas = getLambdasWithTests();

  if (allLambdas.length === 0) {
    console.error("No lambdas found in src/lambdas/");
    process.exit(1);
  }

  const choices = allLambdas.map((name) => ({
    label: hasTests(name) ? `${name}  ✓` : `${name}  (no tests)`,
    value: name
  }));

  choices.push({ label: "Run ALL lambdas", value: "ALL" as string });

  const selected = await askChoice<string>(
    "Select the lambda to test:",
    choices as { label: string; value: string }[]
  );

  rl.close();

  let jestPattern: string;
  let label: string;

  if (selected === "ALL") {
    jestPattern = "";
    label = "all lambdas";
  } else {
    jestPattern = `"src/lambdas/${selected}/__tests__"`;
    label = selected;
  }

  console.log(`\nRunning tests for: ${label}\n`);
  console.log("----------------------------------------\n");

  try {
    execSync(
      `npx jest ${jestPattern ? `--testPathPatterns=${jestPattern}` : ""} --verbose`,
      {
        stdio: "inherit",
        cwd: path.resolve(__dirname, "..")
      }
    );
  } catch {
    // Jest exits with non-zero when tests fail — that's expected behavior.
    // The output is already printed via stdio: "inherit".
    process.exit(1);
  }
};

main().catch((err) => {
  console.error("Fatal error:", err);
  rl.close();
  process.exit(1);
});
