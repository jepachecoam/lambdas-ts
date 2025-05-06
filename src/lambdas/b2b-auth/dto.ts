const getParams = (event: any) => {
  console.log("event =>>>", event);

  const apiKey = event.headers["x-api-key"];
  const appName = event.headers["x-app-name"];
  const isRestApiGateway = !!event.methodArn;
  const stage = event?.requestContext?.stage;
  const httpMethod = event.httpMethod;
  const resource = event.resource;

  return { stage, apiKey, appName, isRestApiGateway, httpMethod, resource };
};

const generatePolicy = (principalId: string, effect: string, resource: any) => {
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

export default { getParams, generatePolicy };
