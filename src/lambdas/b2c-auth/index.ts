import jwt from "jsonwebtoken";

import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import model from "./model";
import types from "./types";
import { IDecodedToken } from "./utils";

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

    // Validate if exist x-idUser-Owner and x-idUser-request in the request
    if (event.headers["x-iduser-owner"] || event.headers["x-iduser-request"]) {
      throw new Error("Tokens included in the request!!!");
    }

    // This validation is temporally - Delete IF in future
    let extraDataContext;
    if (event.headers["x-idbusiness"]) {
      const idBusinessRequest = event.headers["x-idbusiness"];
      const idUserRequest = jwt.decode(
        event.headers["x-auth-id"]
      ) as IDecodedToken;
      const keyUser = `${idUserRequest["custom:idUserMastershop"]}-${idBusinessRequest}`;
      // validate key exist in redis
      const keyExist = await model.getKey(
        keyUser,
        event.requestContext["stage"]
      );
      if (!keyExist) {
        const { data } = await model.getUserBusinessData(
          idBusinessRequest,
          event.requestContext["stage"]
        );
        if (data.length === 0) throw new Error("Business not found!!!");

        let userBusiness = data.find(
          (i: any) =>
            i.idUser === Number(idUserRequest["custom:idUserMastershop"]) &&
            i.idBussiness === Number(idBusinessRequest)
        );
        if (!userBusiness) throw new Error("User not found in business!!!");

        // If relation is equal to COLLABORATOR, find the relation is OWNER
        if (userBusiness.status === "COLLABORATOR") {
          userBusiness = data.find((i: any) => i.relation === "OWNER");
        }

        // Validate when case the business is Inactive OWNER
        if (data[0].status === "INACTIVE")
          throw new Error("Business is currently inactive!!!");

        const dataRedis = {
          idBusiness: idBusinessRequest,
          idUserRequest: idUserRequest["custom:idUserMastershop"],
          idUserOwner: userBusiness.idUser
        };
        await model.setData(
          keyUser,
          JSON.stringify(dataRedis),
          event.requestContext["stage"]
        );
        extraDataContext = {
          "x-iduser-owner": dataRedis["idUserOwner"],
          "x-iduser-request": dataRedis["idUserRequest"]
        };
      }

      extraDataContext = {
        "x-iduser-owner": keyExist["idUserOwner"],
        "x-iduser-request": keyExist["idUserRequest"]
      };
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
        clientType: "B2C",
        ...(event.headers["x-idbusiness"] && { ...extraDataContext })
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
