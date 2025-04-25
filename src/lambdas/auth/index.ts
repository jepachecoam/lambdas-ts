import { CognitoJwtVerifier } from "aws-jwt-verify";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// Constants
const POLICY_VERSION = "2012-10-17";
const BEARER_PREFIX = "Bearer ";
const PRINCIPAL_ID = "user";
const EFFECT = {
  ALLOW: "Allow",
  DENY: "Deny"
};
// const COLLABORATOR_ROLE = 'collaborator';

const generatePolicy = (principalId: any, effect: any, resource: any) => {
  const authResponse: any = {};
  authResponse["principalId"] = principalId;

  if (effect && resource) {
    const policyDocument = {
      Version: POLICY_VERSION,
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

async function getKey(kid: any, cognitoIssuer: any) {
  const client = jwksClient({
    jwksUri: `${cognitoIssuer}/.well-known/jwks.json`
  });

  return new Promise((resolve: any, reject: any) => {
    client.getSigningKey(kid, (err: any, key: any) => {
      if (err) {
        return reject(new Error(`Failed to get signing key: ${err.message}`));
      }
      resolve(key.publicKey || key.rsaPublicKey);
    });
  });
}

async function verifyIdToken(
  token: any,
  cognitoUserPoolId: any,
  cognitoClientId: any,
  secretKey: any
) {
  try {
    // First try to verify with Cognito
    const verifier = CognitoJwtVerifier.create({
      userPoolId: cognitoUserPoolId,
      tokenUse: "id",
      clientId: cognitoClientId
    });

    // @ts-ignore - CognitoJwtVerifier.verify expects 2 args but we're using instance method
    const payload = await verifier.verify(token);
    console.log("Token verified by Cognito. Payload:", payload);
    return payload;
  } catch (err: any) {
    console.log("Cognito verification failed, trying alternative verification");

    // If token is expired, allow access but mark it as expired
    if (err.message.includes("Token expired")) {
      console.log("Token expired, allowing access for refresh token handling");
      return {
        sub: "unknown",
        tokenExpired: true
      };
    }

    // If Cognito verification fails, try alternative verification with secret key
    try {
      const decoded = jwt.verify(token, secretKey);
      console.log("Token verified with alternative method. Payload:", decoded);
      return decoded;
    } catch (altErr: any) {
      console.error("Alternative verification failed:", altErr.message);
      throw new Error(`Token verification failed: ${altErr.message}`);
    }
  }
}

function validateHeaders(
  authHeader: any,
  idHeader: any,
  cognitoIssuer: any,
  cognitoUserPoolId: any,
  cognitoClientId: any,
  secretKey: any
) {
  if (
    !authHeader ||
    !idHeader ||
    !cognitoIssuer ||
    !cognitoClientId ||
    !cognitoUserPoolId ||
    !secretKey
  ) {
    throw new Error(
      "Missing required headers or environment variables: authorization, x-auth-id, cognitoIssuer, cognitoClientId, cognitoUserPoolId, or secretKey"
    );
  }

  if (!authHeader.startsWith(BEARER_PREFIX)) {
    throw new Error(
      'Invalid authorization header format. Must start with "Bearer"'
    );
  }

  return authHeader.replace(BEARER_PREFIX, "");
}

function sanitizeMethodArn(methodArn: any, pathParameters: any) {
  if (!pathParameters) return methodArn;

  return Object.values(pathParameters).reduce(
    (arn: any, value: any) => arn.replace(value, "*"),
    methodArn
  );
}

async function verifyAuthToken(token: any, key: any, cognitoIssuer: any) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      key,
      {
        issuer: cognitoIssuer,
        algorithms: ["RS256"]
      },
      (err, decoded) => {
        if (err) {
          // If token is expired, allow access but mark it as expired
          if (!err.message.includes("jwt expired")) {
            console.log(
              "Token expired, allowing access for refresh token handling"
            );
            reject(new Error(`Token verification failed: ${err.message}`));
            return;
          }
        }
        resolve(decoded);
      }
    );
  });
}

export const handler = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  let response;
  let methodArn = event.methodArn || event.routeArn;
  const isRestApiGateway = !!event.methodArn;

  try {
    // Validate and extract headers
    const authToken = validateHeaders(
      event.headers["authorization"],
      event.headers["x-auth-id"],
      event.stageVariables?.cognitoIssuer,
      event.stageVariables?.cognitoUserPoolId,
      event.stageVariables?.cognitoClientId,
      process.env["JWT_SECRET"]
    );

    // Sanitize methodArn if needed
    methodArn = sanitizeMethodArn(methodArn, event.pathParameters);

    // Decode and validate token
    const decodedToken = jwt.decode(authToken, { complete: true });
    if (!decodedToken?.header?.kid) {
      throw new Error("Invalid token: missing key ID");
    }

    // Get signing key and verify auth token
    const key = await getKey(
      decodedToken.header.kid,
      event.stageVariables.cognitoIssuer
    );
    await verifyAuthToken(authToken, key, event.stageVariables.cognitoIssuer);

    // Verify id token using Cognito or alternative method
    const decodedIdToken: any = await verifyIdToken(
      event.headers["x-auth-id"],
      event.stageVariables.cognitoUserPoolId,
      event.stageVariables.cognitoClientId,
      process.env["JWT_SECRET"]
    );

    // Generate allow policy
    response = {
      ...generatePolicy(PRINCIPAL_ID, EFFECT.ALLOW, methodArn),
      isAuthorized: true,
      context: {
        authorizedToAccess: decodedIdToken.sub || "unknown",
        role: decodedIdToken["custom:role"] || "unknown"
      }
    };
  } catch (error: any) {
    console.error("Authorization failed:", error.message);
    response = {
      ...generatePolicy(PRINCIPAL_ID, EFFECT.DENY, methodArn),
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
