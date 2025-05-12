import dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  const methodArn = event.methodArn || event.routeArn;
  const isRestApiGateway = !!event.methodArn;
  let response;

  try {
    const { stage, apiKey, appName, httpMethod, resource } =
      dto.getParams(event);

    const model = new Model(stage);

    const normalizedArn = dto.normalizeArn(
      methodArn,
      event.pathParameters,
      isRestApiGateway
    );
    const isAuthorized = await model.isAuthorizedRequest(
      apiKey,
      appName,
      httpMethod,
      resource
    );

    const effect = isAuthorized ? "Allow" : "Deny";
    const baseResponse = dto.generatePolicy("user", effect, normalizedArn);

    response = {
      ...baseResponse,
      ...(isAuthorized && {
        isAuthorized: true,
        context: {
          authorizedToAccess: String(appName)
        }
      }),
      ...(!isAuthorized && {
        isAuthorized: false
      })
    };
  } catch (error) {
    console.error("Authorization error:", error);

    const baseResponse = dto.generatePolicy("user", "Deny", methodArn);
    response = {
      ...baseResponse,
      isAuthorized: false
    };
  }

  if (isRestApiGateway) {
    delete response.isAuthorized;
  }

  console.log("Final response:", JSON.stringify(response));
  return response;
};
