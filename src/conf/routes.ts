import { Router } from "express";

import { handler as example } from "../lambdas/example/index";
import { jsonResponse } from "./middlewares/index";

const router = Router();

router.post("/example", jsonResponse(example));

export default router;
