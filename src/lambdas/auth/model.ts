import { CognitoJwtVerifier } from "aws-jwt-verify";
import jwt from "jsonwebtoken";

import types from "./types";
async function verifyToken(
  token: string,
  cognitoUserPoolId: string,
  cognitoClientId: string,
  typeTokenUse: "access" | "id"
) {
  try {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: cognitoUserPoolId,
      tokenUse: typeTokenUse,
      clientId: cognitoClientId
    });

    const payload = await verifier.verify(token);
    return payload;
  } catch (err: any) {
    console.log(err.message);
    if (typeTokenUse === "id") {
      const decoded = jwt.verify(token, `${process.env["JWT_SECRET"]}`);
      console.log("Token verified with alternative method. Payload:", decoded);
      return { decoded, alternativeMethod: true } as any;
    }

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

export default { verifyToken, generatePolicy };
