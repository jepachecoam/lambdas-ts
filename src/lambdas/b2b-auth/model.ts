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
      return false;
    }

    const normalizedMethod = httpMethod.toUpperCase();
    const requiredScope = `${normalizedMethod}:${resource}`;

    let scopes: string[];
    try {
      scopes = JSON.parse(accessItem["scopes"]);
      if (!Array.isArray(scopes)) {
        console.warn("Scopes format is invalid.");
        return false;
      }
    } catch (err) {
      console.error("Failed to parse scopes:", err);
      return false;
    }

    if (scopes.includes("*")) {
      console.log(`Provider ${appName} has access to all scopes with ["*"].`);
      return true;
    }
    const hasScopePermission = scopes.includes(requiredScope);
    console.log(
      `hasScopePermission for resource >>> ${resource} :`,
      hasScopePermission
    );
    return hasScopePermission;
  }
}

export default Model;
