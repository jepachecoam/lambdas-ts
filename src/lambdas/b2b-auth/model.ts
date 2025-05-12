import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";

class Model {
  private dao: Dao;

  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
  }

  async isAuthorizedRequest(
    apiKey: string,
    appName: string,
    httpMethod: string,
    resource: string
  ): Promise<boolean> {
    if (!apiKey || !appName || !httpMethod || !resource) {
      console.warn("Missing required parameters for authorization.");
      return false;
    }

    const secret = await this.dao.getSecret(
      "apigateway/prod/apps/b2b-api-keys"
    );

    if (!secret || !secret[appName]) {
      console.warn("App not found in secrets.");
      return false;
    }

    const isApiKeyValid = secret[appName] === apiKey;
    if (!isApiKeyValid) {
      console.warn("Invalid API key.");
      return false;
    }

    return this.hasScopePermission(appName, httpMethod, resource);
  }

  private async hasScopePermission(
    appName: string,
    httpMethod: string,
    resource: string
  ): Promise<boolean> {
    const accessItem = await this.dao.getItem("B2BAccessControl", {
      provider: appName
    });

    if (!accessItem || !accessItem["isActive"] || !accessItem["scopes"]) {
      console.warn("Access item is missing or inactive.");
      console.log(
        `[ACCESS LOG] Provider "${appName}" denied (no access item).`
      );
      return false;
    }

    let scopes: string[];
    try {
      scopes = JSON.parse(accessItem["scopes"]);
      if (!Array.isArray(scopes)) {
        console.warn("Scopes format is invalid.");
        console.log(
          `[ACCESS LOG] Provider "${appName}" denied (invalid scopes).`
        );
        return false;
      }
    } catch (err) {
      console.error("Failed to parse scopes:", err);
      console.log(
        `[ACCESS LOG] Provider "${appName}" denied (error parsing scopes).`
      );
      return false;
    }

    if (scopes.includes("*")) {
      console.log(
        `[ACCESS LOG] Provider "${appName}" granted full access by wildcard "*".`
      );
      return true;
    }

    const normalizedMethod = httpMethod.toUpperCase();
    const requiredScope = `${normalizedMethod}:${resource}`;

    const denyScopes = scopes.filter((s) => s.startsWith("DENY:"));
    const isDenied = denyScopes.some((pattern) =>
      this.matchScope(pattern.replace("DENY:", ""), requiredScope)
    );
    if (isDenied) {
      console.log(
        `[ACCESS LOG] Provider "${appName}" DENIED by rule for resource "${resource}".`
      );
      return false;
    }

    const allowScopes = scopes.filter((s) => !s.startsWith("DENY:"));
    const isAllowed = allowScopes.some((pattern) =>
      this.matchScope(pattern, requiredScope)
    );

    console.log(
      `[ACCESS LOG] Provider "${appName}" tried "${requiredScope}". Allowed: ${isAllowed}`
    );
    return isAllowed;
  }

  private matchScope(scopePattern: string, actual: string): boolean {
    const [scopeMethod, scopePath] = scopePattern.split(":");
    const [actualMethod, actualPath] = actual.split(":");

    if (scopeMethod !== actualMethod && scopeMethod !== "*") return false;

    const regexPattern =
      "^" +
      scopePath.replace(/\*/g, ".*").replace(/\{[^/]+?\}/g, "[^/]+") +
      "$";

    const patternRegex = new RegExp(regexPattern);

    return patternRegex.test(actualPath);
  }
}

export default Model;
