import { CognitoJwtVerifier } from "aws-jwt-verify";
import jwt from "jsonwebtoken";

import Dao from "./dao";
import types from "./types";

async function verifyToken(
  token: string,
  cognitoUserPoolId: string,
  cognitoClientId: string,
  cognitoClientIdMobile: string,
  typeTokenUse: "access" | "id",
  isMobile: boolean
) {
  try {
    // Use isMobile to validate the clientId from mobile or web
    const verifier = CognitoJwtVerifier.create({
      userPoolId: cognitoUserPoolId,
      tokenUse: typeTokenUse,
      clientId: isMobile ? cognitoClientIdMobile : cognitoClientId
    });

    const payload = await verifier.verify(token);
    console.log(`token type ${typeTokenUse} is verified.`);
    return payload;
  } catch (err: any) {
    if (typeTokenUse === "id") {
      const decoded = jwt.verify(token, `${process.env["JWT_SECRET"]}`);
      console.log(
        "Token type id verified with alternative method. Payload:",
        decoded
      );
      return { decoded, alternativeMethod: true } as any;
    }
    console.log(
      `Error in typeTokenUse ${typeTokenUse} error =>>>`,
      err.message
    );
    throw new Error("token verification failed");
  }
}

const generatePolicy = (principalId: any, effect: any, resource: any) => {
  const authResponse: any = {};
  authResponse["principalId"] = principalId;

  if (effect && resource) {
    const policyDocument = {
      Version: types.Constants.POLICY_VERSION,
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource
        }
      ]
    };
    authResponse["policyDocument"] = policyDocument;
  }

  return authResponse;
};

function validateForbiddenHeaders(headers: any) {
  if (headers["x-iduser-owner"] || headers["x-iduser-request"]) {
    throw new Error("Tokens included in the request!!!");
  }
}

async function getKey(key: string, environment: string) {
  try {
    const dao = new Dao(environment);
    const data = await dao.getCachedItem({ key });
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Redis getKey Error: ", error);
    return null;
  }
}

async function getUserBusinessData(idBusiness: string, stage: string) {
  try {
    const dao = new Dao(stage);
    const response = await dao.userBusinessData(idBusiness, stage);
    return response.data;
  } catch (error) {
    console.log("Error getUserBusinessData >>>", error);
    throw new Error("Error in getUserBusinessData!!!");
  }
}

function validateUserBusiness(
  data: any[],
  idUserRequest: string,
  idBusinessRequest: string
) {
  let userBusiness = data.find(
    (i: any) =>
      i.idUser === Number(idUserRequest) &&
      i.idBussiness === Number(idBusinessRequest)
  );

  if (!userBusiness) {
    throw new Error("User not found in business!!!");
  }

  if (userBusiness.relation === "COLLABORATOR") {
    userBusiness = data.find((i: any) => i.relation === "OWNER");
  }

  if (userBusiness.status === "INACTIVE") {
    throw new Error("Business is currently inactive!!!");
  }

  return userBusiness;
}

async function setData(key: string, value: string, environment: string) {
  try {
    const dao = new Dao(environment);
    const data = await dao.storeCachedItem({ key, value });
    return data ? data : null;
  } catch (error) {
    console.error("Redis setData Error: ", error);
    return null;
  }
}

export default {
  verifyToken,
  generatePolicy,
  validateForbiddenHeaders,
  getKey,
  getUserBusinessData,
  validateUserBusiness,
  setData
};
