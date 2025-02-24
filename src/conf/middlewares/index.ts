import { NextFunction, Request, Response } from "express";

function lambdaHandler(handler: (event: any, context?: any) => Promise<any>) {
  return async function (req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await handler(req, res);

      res.status(result?.statusCode || 200).send(result);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal server error");
    }
  };
}

export default lambdaHandler;
