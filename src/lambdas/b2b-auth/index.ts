import { matchSecret } from "./secretsDealer";

const generatePolicy = (principalId: any, effect: any, resource: any) => {
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
};

export const handler = async (event: any) => {
  let response;
  let policyDocument;
  console.log("event>>>", JSON.stringify(event, null, 2));
  const apiKey = event.headers["x-api-key"];
  const appName = event.headers["x-app-name"];
  let methodArn = event.methodArn || event.routeArn;
  const isRestApiGateway = !!event.methodArn;

  try {
    if (isRestApiGateway && event.pathParameters) {
      for (const [_key, value] of Object.entries(event.pathParameters)) {
        methodArn = methodArn.replace(value, "*");
      }
    }

    const isMatched = await matchSecret(apiKey, appName);
    policyDocument = generatePolicy("user", "Deny", methodArn);
    response = {
      ...policyDocument,
      isAuthorized: false
    };

    if (isMatched) {
      policyDocument = generatePolicy("user", "Allow", methodArn);
      response = {
        ...policyDocument,
        isAuthorized: true,
        context: {
          authorizedToAccess: String(appName)
        }
      };
    }
  } catch {
    policyDocument = generatePolicy("user", "Deny", methodArn);
    response = {
      ...policyDocument,
      isAuthorized: false
    };
  } finally {
    if (isRestApiGateway) {
      delete response.isAuthorized;
    }
    console.log("response>>>", JSON.stringify(response));
  }

  return response;
};
