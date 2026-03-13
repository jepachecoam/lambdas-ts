import { CognitoJwtVerifier } from "aws-jwt-verify";
import jwt from "jsonwebtoken";

import Dao from "./dao";
import types, { IUserRecord } from "./types";

class Model {
  private dao: Dao;

  constructor(dao: Dao) {
    this.dao = dao;
  }

  static generatePolicy(principalId: any, effect: any, resource: any) {
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
  }

  async verifyToken(
    token: string,
    cognitoUserPoolId: string,
    cognitoClientId: string,
    cognitoClientIdMobile: string,
    typeTokenUse: "access" | "id",
    isMobile: boolean
  ) {
    try {
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

  validateForbiddenHeaders(headers: any) {
    if (headers["x-iduser-owner"] || headers["x-iduser-request"]) {
      throw new Error("Tokens included in the request!!!");
    }
  }

  async getKey(key: string) {
    try {
      const data = await this.dao.getCachedItem({ key });
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Redis getKey Error: ", error);
      return null;
    }
  }

  async getUserBusinessData(idBusiness: string, stage: string) {
    try {
      const response = await this.dao.userBusinessData(idBusiness, stage);
      return response.data;
    } catch (error) {
      console.log("Error getUserBusinessData >>>", error);
      throw new Error("Error in getUserBusinessData!!!");
    }
  }

  validateUserBusiness(
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

  async setData(key: string, value: string) {
    try {
      const data = await this.dao.storeCachedItem({ key, value });
      return data ? data : null;
    } catch (error) {
      console.error("Redis setData Error: ", error);
      return null;
    }
  }

  async validateUserDataIntegrity(
    cognitoSub: string,
    emailFromToken: string,
    idUserMastershop: string
  ): Promise<void> {
    try {
      const dbUser: IUserRecord | null =
        await this.dao.getUserByCognitoSub(cognitoSub);

      if (!dbUser) {
        throw new Error("User not found in database");
      }

      if (dbUser.email !== emailFromToken) {
        throw new Error("User email mismatch");
      }

      if (String(dbUser.idUser) !== idUserMastershop) {
        throw new Error("User idUser mismatch");
      }
    } catch (error) {
      console.error("Error in validateUserDataIntegrity:", error);
      throw error;
    }
  }
}

export default Model;
