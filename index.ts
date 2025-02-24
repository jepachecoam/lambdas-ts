import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", async (req: any, res: any) => {
  try {
    res.json({ message: "hello from lambda" });
  } catch (err) {
    console.error("Error executing Lambda:", err);
    res.status(500).send("Error processing request");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
