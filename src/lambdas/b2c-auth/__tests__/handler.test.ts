/**
 * handler.test.ts — b2c-auth
 *
 * Tests invoke the handler directly with realistic API Gateway events.
 * Only external dependencies are mocked (Cognito, DB, Redis, HTTP services).
 * Internal layers (model, dao, dto) run as-is — their logic is validated
 * through the handler's observable output: the IAM policy and context.
 */

import { CognitoJwtVerifier } from "aws-jwt-verify";
import axios from "axios";
import jwt from "jsonwebtoken";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("aws-jwt-verify");
jest.mock("axios");
jest.mock("jsonwebtoken");

jest.mock("../../../shared/databases/db-sm/db", () =>
  jest.fn().mockResolvedValue({ fetchOne: jest.fn() })
);

jest.mock("../../../shared/databases/cache", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn()
    })
  }
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import CacheDB from "../../../shared/databases/cache";
import dbSm from "../../../shared/databases/db-sm/db";
import { handler } from "../index";

// ─── Mock helpers ─────────────────────────────────────────────────────────────
// Cast to unknown first to bypass strict overload inference from @jest/globals.
// This is the correct pattern when mocking modules with opaque return types.

const mockDbSm = dbSm as unknown as jest.Mock;
const mockCognitoCreate = CognitoJwtVerifier.create as unknown as jest.Mock;
const mockAxiosGet = axios.get as unknown as jest.Mock;
const mockJwtVerify = jwt.verify as unknown as jest.Mock;
const mockJwtDecode = jwt.decode as unknown as jest.Mock;
const mockGetCacheInstance = CacheDB.getInstance as unknown as jest.Mock;

// ─── Environment setup ────────────────────────────────────────────────────────

beforeAll(() => {
  process.env["JWT_SECRET"] = "test-secret";
  process.env["REDIS_HOST"] = "localhost";
  process.env["REDIS_PORT"] = "6379";
  process.env["REDIS_TTL_IN_MINUTES"] = "10";
  process.env["MS_API_URL"] = "https://api.test.com";
  process.env["MS_APP_NAME"] = "test-app";
  process.env["MS_API_KEY"] = "test-key";
  process.env["DB_SECRET_DEV"] = "dev/db/secret";
  process.env["DB_SECRET_QA"] = "qa/db/secret";
  process.env["DB_SECRET_PROD"] = "prod/db/secret";
  process.env["DB_SECRET_REGION"] = "us-east-1";
});

// ─── Event builder ────────────────────────────────────────────────────────────

/**
 * Builds a minimal HTTP API Gateway v2 event (routeArn).
 * Override any field per test to simulate specific scenarios.
 */
const buildEvent = (
  overrides: Record<string, unknown> = {}
): Record<string, unknown> => ({
  routeArn:
    "arn:aws:execute-api:us-east-1:123456789:api-id/dev/GET/some/resource",
  headers: {
    authorization: "Bearer access-token",
    "x-auth-id": "id-token"
  },
  requestContext: { stage: "dev" },
  stageVariables: {
    cognitoUserPoolId: "us-east-1_testPool",
    cognitoClientId: "web-client-id",
    cognitoClientIdMobile: "mobile-client-id",
    cognitoIssuer:
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_testPool"
  },
  pathParameters: null,
  ...overrides
});

// ─── Shared fixtures ──────────────────────────────────────────────────────────

/**
 * Decoded token payload — represents the user identity from the ID token.
 * Must stay consistent with baseDbUser for integrity checks to pass.
 */
const baseDecodedToken = {
  sub: "user-sub-123",
  email: "user@test.com",
  "custom:idUserMastershop": "42"
};

/**
 * DB user record — must match baseDecodedToken for integrity checks to pass.
 */
const baseDbUser = {
  idUser: 42,
  email: "user@test.com",
  cognitoSub: "user-sub-123"
};

// ─── Setup helpers ────────────────────────────────────────────────────────────

/**
 * Mocks Cognito to successfully verify both access and ID tokens.
 * Both return sub: "user-sub-123" so the mismatch check passes.
 */
const setupValidCognito = () => {
  (mockCognitoCreate as jest.Mock)
    .mockReturnValueOnce({
      verify: jest
        .fn()
        .mockResolvedValue({ sub: "user-sub-123", token_use: "access" })
    })
    .mockReturnValueOnce({
      verify: jest
        .fn()
        .mockResolvedValue({ sub: "user-sub-123", token_use: "id" })
    });
};

const setupDefaultDb = (overrides: Partial<typeof baseDbUser> = {}) => {
  (mockDbSm as jest.Mock).mockResolvedValue({
    fetchOne: jest.fn().mockResolvedValue({ ...baseDbUser, ...overrides })
  });
};

const setupDefaultCache = (cachedValue: string | null = null) => {
  mockGetCacheInstance.mockReturnValue({
    get: jest.fn().mockResolvedValue(cachedValue),
    set: jest.fn().mockResolvedValue("OK")
  } as any);
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("b2c-auth handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultDb();
    setupDefaultCache();
    (mockJwtDecode as jest.Mock).mockReturnValue(baseDecodedToken);
  });

  // ── Allow: happy path ──────────────────────────────────────────────────────

  describe("Allow policy", () => {
    it("returns Allow with clientType B2C when both tokens are valid", async () => {
      setupValidCognito();

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(true);
      expect(response.policyDocument.Statement[0].Effect).toBe("Allow");
      expect(response.context.clientType).toBe("B2C");
    });

    it("returns Allow for a mobile request", async () => {
      setupValidCognito();

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "request-origin": "mobile"
          }
        })
      );

      expect(response.isAuthorized).toBe(true);
      expect(response.policyDocument.Statement[0].Effect).toBe("Allow");
    });

    it("returns Allow with idUserOwner and idUserRequest when user is OWNER of the business", async () => {
      setupValidCognito();
      (mockAxiosGet as jest.Mock).mockResolvedValue({
        data: {
          data: [
            { idUser: 42, idBussiness: 99, relation: "OWNER", status: "ACTIVE" }
          ]
        }
      });

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-idbusiness": "99"
          }
        })
      );

      expect(response.isAuthorized).toBe(true);
      expect(response.context.idUserOwner).toBe(42);
      expect(response.context.idUserRequest).toBe(42);
    });

    it("returns Allow with OWNER idUser when requesting user is COLLABORATOR", async () => {
      setupValidCognito();
      (mockJwtDecode as jest.Mock).mockReturnValue({
        ...baseDecodedToken,
        "custom:idUserMastershop": "10"
      });
      setupDefaultDb({ idUser: 10 });
      (mockAxiosGet as jest.Mock).mockResolvedValue({
        data: {
          data: [
            {
              idUser: 10,
              idBussiness: 99,
              relation: "COLLABORATOR",
              status: "ACTIVE"
            },
            { idUser: 5, idBussiness: 99, relation: "OWNER", status: "ACTIVE" }
          ]
        }
      });

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-idbusiness": "99"
          }
        })
      );

      expect(response.isAuthorized).toBe(true);
      expect(response.context.idUserOwner).toBe(5);
      expect(response.context.idUserRequest).toBe(10);
    });

    it("returns Allow using cached business data without calling the microservice", async () => {
      setupValidCognito();
      setupDefaultCache(
        JSON.stringify({ idBusiness: 99, idUserOwner: 5, idUserRequest: 10 })
      );

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-idbusiness": "99"
          }
        })
      );

      expect(response.isAuthorized).toBe(true);
      expect(response.context.idUserOwner).toBe(5);
      expect(response.context.idUserRequest).toBe(10);
      expect(mockAxiosGet).not.toHaveBeenCalled();
    });

    it("skips business validation for shippingQuote route even with x-idbusiness", async () => {
      setupValidCognito();

      const response = await handler(
        buildEvent({
          rawPath: "/dev/logistics/shippingQuote",
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-idbusiness": "99"
          }
        })
      );

      expect(response.isAuthorized).toBe(true);
      expect(response.context.idUserOwner).toBeUndefined();
      expect(response.context.idUserRequest).toBeUndefined();
    });

    it("returns Allow when ID token fails Cognito but passes JWT fallback", async () => {
      (mockCognitoCreate as jest.Mock)
        .mockReturnValueOnce({
          verify: jest.fn().mockResolvedValue({ sub: "user-sub-123" })
        })
        .mockReturnValueOnce({
          verify: jest.fn().mockRejectedValue(new Error("Cognito failed"))
        });
      (mockJwtVerify as jest.Mock).mockReturnValue({
        sub: "user-sub-123",
        email: "user@test.com"
      });

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(true);
      expect(response.policyDocument.Statement[0].Effect).toBe("Allow");
    });

    it("removes isAuthorized field when triggered via REST API Gateway (methodArn)", async () => {
      setupValidCognito();

      const response = await handler(
        buildEvent({
          methodArn:
            "arn:aws:execute-api:us-east-1:123456789:api-id/dev/GET/some/resource",
          routeArn: undefined
        })
      );

      expect(response.isAuthorized).toBeUndefined();
      expect(response.policyDocument.Statement[0].Effect).toBe("Allow");
    });

    it("wildcards path parameter values in the policy resource ARN", async () => {
      setupValidCognito();

      const response = await handler(
        buildEvent({
          routeArn:
            "arn:aws:execute-api:us-east-1:123456789:api-id/dev/GET/orders/42",
          pathParameters: { orderId: "42" }
        })
      );

      expect(response.isAuthorized).toBe(true);
      expect(response.policyDocument.Statement[0].Resource).toBe(
        "arn:aws:execute-api:us-east-1:123456789:api-id/dev/GET/orders/*"
      );
    });
  });

  // ── Deny: header validation ────────────────────────────────────────────────

  describe("Deny policy — header validation", () => {
    it("returns Deny when authorization header is missing", async () => {
      const response = await handler(
        buildEvent({ headers: { "x-auth-id": "id-token" } })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when x-auth-id header is missing", async () => {
      const response = await handler(
        buildEvent({ headers: { authorization: "Bearer access-token" } })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when authorization does not start with Bearer", async () => {
      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Token access-token",
            "x-auth-id": "id-token"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when x-client-type header is present", async () => {
      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-client-type": "mobile"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when x-iduser-owner header is present", async () => {
      setupValidCognito();

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-iduser-owner": "5"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when x-iduser-request header is present", async () => {
      setupValidCognito();

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-iduser-request": "10"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when x-country header is present", async () => {
      setupValidCognito();

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-country": "US"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when x-currency header is present", async () => {
      setupValidCognito();

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-currency": "USD"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });
  });

  // ── Deny: token verification ───────────────────────────────────────────────

  describe("Deny policy — token verification", () => {
    it("returns Deny when access token is rejected by Cognito", async () => {
      (mockCognitoCreate as jest.Mock).mockReturnValue({
        verify: jest.fn().mockRejectedValue(new Error("Invalid token"))
      });

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when ID token fails both Cognito and JWT fallback", async () => {
      (mockCognitoCreate as jest.Mock)
        .mockReturnValueOnce({
          verify: jest.fn().mockResolvedValue({ sub: "user-sub-123" })
        })
        .mockReturnValueOnce({
          verify: jest.fn().mockRejectedValue(new Error("Cognito failed"))
        });
      (mockJwtVerify as jest.Mock).mockImplementation(() => {
        throw new Error("JWT fallback failed");
      });

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when access token and ID token belong to different users", async () => {
      (mockCognitoCreate as jest.Mock)
        .mockReturnValueOnce({
          verify: jest.fn().mockResolvedValue({ sub: "user-sub-123" })
        })
        .mockReturnValueOnce({
          verify: jest.fn().mockResolvedValue({ sub: "different-sub-456" })
        });

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });
  });

  // ── Deny: user data integrity ──────────────────────────────────────────────

  describe("Deny policy — user data integrity", () => {
    it("returns Deny when user does not exist in the database", async () => {
      setupValidCognito();
      (mockDbSm as jest.Mock).mockResolvedValue({
        fetchOne: jest.fn().mockResolvedValue(null)
      });

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when email in token does not match the database record", async () => {
      setupValidCognito();
      setupDefaultDb({ email: "other@test.com" });

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when idUserMastershop in token does not match the database idUser", async () => {
      setupValidCognito();
      setupDefaultDb({ idUser: 999 });

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });
  });

  // ── Deny: business validation ──────────────────────────────────────────────

  describe("Deny policy — business validation", () => {
    it("returns Deny when the business is not found", async () => {
      setupValidCognito();
      (mockAxiosGet as jest.Mock).mockResolvedValue({ data: { data: [] } });

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-idbusiness": "99"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when user does not belong to the requested business", async () => {
      setupValidCognito();
      (mockAxiosGet as jest.Mock).mockResolvedValue({
        data: {
          data: [
            {
              idUser: 999,
              idBussiness: 99,
              relation: "OWNER",
              status: "ACTIVE"
            }
          ]
        }
      });

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-idbusiness": "99"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });

    it("returns Deny when the business is inactive", async () => {
      setupValidCognito();
      (mockAxiosGet as jest.Mock).mockResolvedValue({
        data: {
          data: [
            {
              idUser: 42,
              idBussiness: 99,
              relation: "OWNER",
              status: "INACTIVE"
            }
          ]
        }
      });

      const response = await handler(
        buildEvent({
          headers: {
            authorization: "Bearer access-token",
            "x-auth-id": "id-token",
            "x-idbusiness": "99"
          }
        })
      );

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
    });
  });

  // ── Deny: environment configuration ───────────────────────────────────────

  describe("Deny policy — environment configuration", () => {
    it("returns Deny when a required environment variable is missing", async () => {
      const original = process.env["JWT_SECRET"];
      delete process.env["JWT_SECRET"];

      const response = await handler(buildEvent());

      expect(response.isAuthorized).toBe(false);
      expect(response.policyDocument.Statement[0].Effect).toBe("Deny");

      process.env["JWT_SECRET"] = original;
    });
  });
});
