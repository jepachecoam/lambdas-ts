import types from "./types";

const validateHeaders = (event: any) => {
  const authHeader = event.headers["authorization"];
  const idToken = event.headers["x-auth-id"];
  const clientType = event.headers["x-client-type"];
  const cognitoIssuer = event.stageVariables?.cognitoIssuer;
  const cognitoUserPoolId = event.stageVariables?.cognitoUserPoolId;
  const cognitoClientId = event.stageVariables?.cognitoClientId;

  if (clientType) {
    console.log(`clientType: ${clientType} not allowed`);
    throw new Error("Client type not allowed");
  }

  if (
    !authHeader ||
    !idToken ||
    !cognitoIssuer ||
    !cognitoClientId ||
    !cognitoUserPoolId ||
    !authHeader.startsWith(types.Constants.BEARER_PREFIX)
  ) {
    throw new Error("Missing required ");
  }
  const authorizationToken = authHeader.replace(
    types.Constants.BEARER_PREFIX,
    ""
  );

  return { authorizationToken, idToken };
};

const sanitizeMethodArn = (methodArn: any, pathParameters: any) => {
  if (!pathParameters) return methodArn;

  return Object.values(pathParameters).reduce(
    (arn: any, value: any) => arn.replace(value, "*"),
    methodArn
  );
};

const sanitizeHeaders = (headers: any) => {
  const sanitizedHeaders: any = Object.fromEntries(
    Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  return sanitizedHeaders;
};

export default { validateHeaders, sanitizeMethodArn, sanitizeHeaders };
