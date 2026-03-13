import jwt from "jsonwebtoken";

import CacheDB from "../../shared/databases/cache";
import dbSm from "../../shared/databases/db-sm/db";
import { dbEnvSm } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import dto from "./dto";
import Model from "./model";
import types from "./types";
import { IDecodedToken } from "./utils";

export const handler = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  let response;
  let methodArn = event.methodArn || event.routeArn;
  const isRestApiGateway = !!event.methodArn;

  try {
    // Check required environment variables
    checkEnv({ ...types.EnvsEnum, ...dbEnvSm });

    // Sanitize headers to ensure consistent access
    event.headers = dto.sanitizeHeaders(event.headers);

    // Validate and extract headers
    const { authorizationToken, idToken } = dto.validateHeaders(event);

    // Sanitize methodArn if needed
    methodArn = dto.sanitizeMethodArn(methodArn, event.pathParameters);

    // New header request-origin to validate if the request is from mobile
    const isMobile = event.headers["request-origin"] === "mobile";

    // Build dependencies
    const stage = event.requestContext["stage"];
    const db = await dbSm({ environment: stage });
    const cacheDB = CacheDB.getInstance(stage);
    const dao = new Dao(db, cacheDB);
    const model = new Model(dao);

    const accessTokenResponse = await model.verifyToken(
      authorizationToken,
      event.stageVariables.cognitoUserPoolId,
      event.stageVariables.cognitoClientId,
      event.stageVariables.cognitoClientIdMobile,
      "access",
      isMobile
    );

    const idTokenResponse = await model.verifyToken(
      idToken,
      event.stageVariables.cognitoUserPoolId,
      event.stageVariables.cognitoClientId,
      event.stageVariables.cognitoClientIdMobile,
      "id",
      isMobile
    );

    if (
      !idTokenResponse.alternativeMethod &&
      accessTokenResponse["sub"] !== idTokenResponse["sub"]
    ) {
      throw new Error("Token mismatch");
    }

    // Validate if exist x-idUser-Owner and x-idUser-request in the request
    model.validateForbiddenHeaders(event.headers);

    // Decode x-auth-id to extract user attributes
    const idTokenDecoded = jwt.decode(
      event.headers["x-auth-id"]
    ) as IDecodedToken;

    // Validate user data integrity against DB
    await model.validateUserDataIntegrity(
      idTokenResponse["sub"] as string,
      idTokenDecoded["email"] as string,
      idTokenDecoded["custom:idUserMastershop"] as string
    );

    // This validation is temporally and const isShippingQuoteRoute - Delete IF in future
    let extraDataContext;
    const isShippingQuoteRoute = event.rawPath?.includes(
      "/logistics/shippingQuote"
    );
    if (event.headers["x-idbusiness"] && !isShippingQuoteRoute) {
      const idBusinessRequest = event.headers["x-idbusiness"];
      const keyUser = `${idTokenDecoded["custom:idUserMastershop"]}-${idBusinessRequest}-${stage}`;
      // validate key exist in redis
      const keyExist = await model.getKey(keyUser);
      if (!keyExist) {
        const { data } = await model.getUserBusinessData(
          idBusinessRequest,
          stage
        );
        if (data.length === 0) {
          throw new Error("Business not found!!!");
        }

        const userBusiness = model.validateUserBusiness(
          data,
          String(idTokenDecoded["custom:idUserMastershop"]),
          idBusinessRequest
        );

        const dataRedis = {
          idBusiness: Number(idBusinessRequest),
          idUserRequest: Number(idTokenDecoded["custom:idUserMastershop"]),
          idUserOwner: Number(userBusiness.idUser)
        };
        await model.setData(keyUser, JSON.stringify(dataRedis));
        extraDataContext = {
          idUserOwner: dataRedis["idUserOwner"],
          idUserRequest: dataRedis["idUserRequest"]
        };
      } else {
        extraDataContext = {
          idUserOwner: keyExist["idUserOwner"],
          idUserRequest: keyExist["idUserRequest"]
        };
      }
    }

    // Generate allow policy
    response = {
      ...Model.generatePolicy(
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
      ...Model.generatePolicy(
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
