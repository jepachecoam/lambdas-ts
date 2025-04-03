import express from "express";

import serverConf from "./src/conf/config";
import router from "./src/conf/routes";
import { checkEnv } from "./src/shared/envChecker";
import { ServerEnv } from "./src/shared/types";

checkEnv(ServerEnv);

const app = express();

app.use(express.json());

app.use(router);

const PORT = serverConf.server.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
