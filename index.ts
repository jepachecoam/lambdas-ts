import express from "express";

import serverConf from "./src/conf/config";
import router from "./src/conf/routes";

const app = express();

app.use(express.json());

app.use(router);

const PORT = serverConf.server.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
