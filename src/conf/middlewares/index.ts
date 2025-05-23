import { NextFunction, Request, Response } from "express";

function jsonResponse({
  handler,
  customResponse
}: {
  handler: (event: any, context?: any) => Promise<any>;
  customResponse?: boolean;
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

      if (customResponse) {
        return res.status(200).json(result);
      }

      if (!result || !result.statusCode || !result.body) {
        return res
          .status(500)
          .json({ message: "Function should return statusCode and body" });
      }

      const responseBody = result.body ? JSON.parse(result.body) : {};

      return res.status(result.statusCode).json(responseBody);
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send("Internal server error");
    }
  };
}

export { jsonResponse };
