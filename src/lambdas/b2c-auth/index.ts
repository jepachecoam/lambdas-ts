import { checkEnv } from "../../shared/envChecker";
import dto from "./dto";
import model from "./model";
import types from "./types";

export const handler = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  let response;
  let methodArn = event.methodArn || event.routeArn;
  const isRestApiGateway = !!event.methodArn;

  try {
    // Check required environment variables
    checkEnv(types.Envs);

    // Validate and extract headers
    const { authorizationToken, idToken } = dto.validateHeaders(event);

    // Sanitize methodArn if needed
    methodArn = dto.sanitizeMethodArn(methodArn, event.pathParameters);

    const accessTokenResponse = await model.verifyToken(
      authorizationToken,
      event.stageVariables.cognitoUserPoolId,
      event.stageVariables.cognitoClientId,
      "access"
    );

    const idTokenResponse = await model.verifyToken(
      idToken,
      event.stageVariables.cognitoUserPoolId,
      event.stageVariables.cognitoClientId,
      "id"
    );

    if (
      !idTokenResponse.alternativeMethod &&
      accessTokenResponse["sub"] !== idTokenResponse["sub"]
    ) {
      throw new Error("Token mismatch");
    }

    // Generate allow policy
    response = {
      ...model.generatePolicy(
        types.Constants.PRINCIPAL_ID,
        types.Constants.ALLOW,
        methodArn
      ),
      isAuthorized: true,
      context: {
        clientType: "B2C"
      }
    };
  } catch (error: any) {
    response = {
      ...model.generatePolicy(
        types.Constants.PRINCIPAL_ID,
        types.Constants.DENY,
        methodArn
      ),
      isAuthorized: false,
      error: error.message
    };
  } finally {
    if (isRestApiGateway) {
      delete response.isAuthorized;
    }
    console.log("Response:", JSON.stringify(response, null, 2));
  }

  return response;
};
