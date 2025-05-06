import dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  let response;
  let policyDocument;
  let methodArn = event.methodArn || event.routeArn;
  const { stage, apiKey, appName, isRestApiGateway, httpMethod, resource } =
    dto.getParams(event);

  try {
    const model = new Model(stage);
    if (isRestApiGateway && event.pathParameters) {
      for (const [_key, value] of Object.entries(event.pathParameters)) {
        methodArn = methodArn.replace(value, "*");
      }
    }

    const isValid = await model.isValid(apiKey, appName, httpMethod, resource);
    policyDocument = dto.generatePolicy("user", "Deny", methodArn);
    response = {
      ...policyDocument,
      isAuthorized: false
    };

    if (isValid) {
      policyDocument = dto.generatePolicy("user", "Allow", methodArn);
      response = {
        ...policyDocument,
        isAuthorized: true,
        context: {
          authorizedToAccess: String(appName)
        }
      };
    }
  } catch (error) {
    console.error(error);
    policyDocument = dto.generatePolicy("user", "Deny", methodArn);
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
