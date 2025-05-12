function getParams(event: any) {
  console.log("event =>>>", JSON.stringify(event));

  const apiKey = event.headers?.["x-api-key"];
  const appName = event.headers?.["x-app-name"];
  const stage = event?.requestContext?.stage;

  const isRestApiGateway = !!event.methodArn;

  if (!apiKey || !appName || !stage) {
    throw new Error("Missing required parameters for authorization.");
  }

  const baseParams = {
    stage,
    apiKey,
    appName,
    isRestApiGateway
  };

  const result = isRestApiGateway
    ? handleRest(event, baseParams)
    : handleHttp(event, baseParams);

  console.log("result =>>>", result);

  return result;
}

function handleRest(event: any, baseParams: any) {
  const httpMethod = event.httpMethod;
  const fullPath = event.path;

  if (!httpMethod || !fullPath) {
    throw new Error("Missing REST API parameters.");
  }

  const parts = fullPath.split("/").filter(Boolean);
  const normalizedPath = "/" + parts.slice(1).join("/");

  return {
    ...baseParams,
    httpMethod: httpMethod.toUpperCase(),
    resource: normalizedPath
  };
}

function handleHttp(event: any, baseParams: any) {
  const httpMethod = event.requestContext?.http?.method;
  const fullPath = event.requestContext?.http?.path || event.rawPath;

  if (!httpMethod || !fullPath) {
    throw new Error("Missing HTTP API parameters.");
  }

  const parts = fullPath.split("/").filter(Boolean);
  const normalizedPath = "/" + parts.slice(3).join("/");

  return {
    ...baseParams,
    httpMethod: httpMethod.toUpperCase(),
    resource: normalizedPath
  };
}

function generatePolicy(principalId: string, effect: string, resource: any) {
  const authResponse: any = {};
  authResponse.principalId = principalId;

  if (effect && resource) {
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource
        }
      ]
    };
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
}

function normalizeArn(
  arn: string,
  pathParams: Record<string, string> | undefined,
  isRest: boolean
): string {
  if (!isRest || !pathParams) return arn;

  let normalized = arn;
  for (const value of Object.values(pathParams)) {
    normalized = normalized.replace(value, "*");
  }

  return normalized;
}

export default { getParams, generatePolicy, normalizeArn };
