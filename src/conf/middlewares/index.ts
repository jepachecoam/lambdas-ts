import { NextFunction, Request, Response } from "express";

type ResponseType = "http" | "excel" | "pdf" | "void";

function serverResponse({
  handler,
  responseType
}: {
  handler: (event: any, context?: any) => Promise<any>;
  responseType: ResponseType;
}) {
  return async function (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const event = req.body;
      const context = {};

      const result = await handler(event, context);

      switch (responseType) {
        case "http": {
          if (result.headers) {
            for (const [key, value] of Object.entries(result.headers)) {
              res.setHeader(key, value as string | number | string[]);
            }
          }

          const body = result.body;
          return res.status(result.statusCode).send(body);
        }

        case "excel": {
          const buffer = Buffer.from(result.body, "base64");
          res.setHeader("Content-Type", result.headers["Content-Type"]);
          res.setHeader(
            "Content-Disposition",
            result.headers["Content-Disposition"]
          );
          return res.status(result.statusCode).send(buffer);
        }

        case "pdf": {
          const buffer = Buffer.from(result.body, "base64");
          res.setHeader("Content-Type", result.headers["Content-Type"]);
          res.setHeader(
            "Content-Disposition",
            result.headers["Content-Disposition"]
          );
          return res.status(result.statusCode).send(buffer);
        }

        case "void": {
          return res.status(200).send({ result: "proccesed" });
        }
      }
    } catch (error) {
      console.error("Error in serverResponse:", error);
      return res.status(500).send("Internal server error");
    }
  };
}

export { serverResponse };
