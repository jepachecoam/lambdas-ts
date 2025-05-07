import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
  }
  async isValid(
    apiKey: string,
    appName: string,
    httpMethod: string,
    resource: string
  ): Promise<boolean> {
    const secret = await this.dao.getSecret(
      "apigateway/prod/apps/b2b-api-keys"
    );

    let isMatched = secret[appName] === apiKey;

    if (isMatched) {
      isMatched = await this.checkScopeAccess(appName, httpMethod, resource);
    }

    return isMatched;
  }

  async checkScopeAccess(
    appName: string,
    httpMethod: string,
    resource: string
  ): Promise<boolean> {
    const item = await this.dao.getItem("B2BAccessControl", {
      provider: appName
    });

    console.log("Access control item =>>>", item, httpMethod);

    if (!item || item["isActive"] !== true || !item["scopes"]) {
      return false;
    }

    const normalizedMethod = httpMethod.toUpperCase();
    const requiredScope = `${normalizedMethod}:${resource}`;

    console.log("requiredScope =>>>", requiredScope);

    let scopes: string[] = [];

    try {
      scopes = JSON.parse(item["scopes"]);
    } catch (error) {
      console.error("Error parsing scopes for provider:", appName, error);
      return false;
    }

    if (!Array.isArray(scopes)) return false;

    if (scopes.includes("*")) return true;

    return scopes.includes(requiredScope);
  }
}

export default Model;
