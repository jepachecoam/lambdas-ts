import { Router } from "express";

import { handler as example } from "../use-cases/example/index";
import lambdaHandler from "./middlewares/index";

const router = Router();

router.post("/example", lambdaHandler(example));

export default router;
