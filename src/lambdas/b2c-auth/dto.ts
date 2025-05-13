import types from "./types";

const validateHeaders = (event: any) => {
  const authHeader = event.headers["authorization"];
  const idToken = event.headers["x-auth-id"];
  const cognitoIssuer = event.stageVariables?.cognitoIssuer;
  const cognitoUserPoolId = event.stageVariables?.cognitoUserPoolId;
  const cognitoClientId = event.stageVariables?.cognitoClientId;
  const clientType = event.headers["x-client-type"];

  if (clientType) {
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

export default { validateHeaders, sanitizeMethodArn };
