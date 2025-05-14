import axios, { AxiosInstance, AxiosResponse } from "axios";

import { EnvironmentTypes } from "../../shared/types";
import {
  AddItemToBlacklistParams,
  AddUserToBlacklistParams,
  UpdateItemToBlacklistParams
} from "./types/types";

class Request {
  private client: AxiosInstance;
  private environment: string;

  constructor(environment: EnvironmentTypes) {
    this.environment = environment;

    this.client = axios.create({
      headers: {
        "x-api-key": process.env["API_KEY_MS"],
        "x-app-name": process.env["APP_NAME_MS"]
      },
      baseURL: process.env["BASE_URL_B2B"]
    });
  }

  async addItemToBlacklist({
    idBlacklistEntityType,
    idEntity,
    idReference,
    idBlacklistReason
  }: AddItemToBlacklistParams): Promise<void> {
    try {
      const payload = {
        updateSourceType: "PROCESS",
        idUpdateSource: "lambda-MasterShop-Blacklist-MonitorWallet",
        idBlacklistReason: idBlacklistReason,
        idBlacklistEntityType: idBlacklistEntityType,
        idEntity: idEntity,
        reference: {
          idBlacklistEntityType: 2,
          idReference: idReference
        }
      };

      const response: AxiosResponse = await this.client.post(
        `/${this.environment}/api/b2b/blacklist`,
        payload
      );
      console.log("response =>>>", response.data);

      console.log(
        `idEntity ${idEntity} idBlacklistEntityType ${idBlacklistEntityType} idReference ${idReference} added to blacklist`
      );
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data) {
        console.log(
          `idEntity ${idEntity} idBlacklistEntityType ${idBlacklistEntityType} idReference ${idReference} not added to blacklist err:`,
          err.response.data
        );
      } else {
        console.log("Error in addItemToBlacklist request =>>>", err);
      }
    }
  }

  async addUserToBlacklist({
    idBlacklistReason,
    idBusiness,
    idUser
  }: AddUserToBlacklistParams) {
    try {
      const NEGATIVE_WALLET_REASON = 1;
      const ENTITY_TYPE_BUSINESS = 2;

      const payload = {
        idUser: idUser,
        idEntity: idBusiness,
        updateSourceType: "PROCESS",
        idUpdateSource: "lambda-MasterShop-Blacklist-MonitorWallet",
        reasonIds: [NEGATIVE_WALLET_REASON, idBlacklistReason],
        typeEntity: ENTITY_TYPE_BUSINESS
      };

      console.log("[addUserToBlacklist] payload:", payload);

      const response: AxiosResponse = await this.client.post(
        `/${this.environment}/api/b2b/blacklist/user/related`,
        payload
      );

      console.log("[addUserToBlacklist] response:", response.data);
      return response.data;
    } catch (error) {
      console.error("[addUserToBlacklist] error:", error);
      throw error;
    }
  }

  async updateItemToBlacklist({
    idBlacklist,
    newStatus
  }: UpdateItemToBlacklistParams): Promise<void> {
    try {
      const payload = {
        updateSourceType: "PROCESS",
        idUpdateSource: "lambda-MasterShop-Blacklist-MonitorWallet",
        idBlacklist: idBlacklist,
        newStatus: newStatus
      };

      const response: AxiosResponse = await this.client.patch(
        `${this.environment}/api/b2b/blacklist`,
        payload
      );
      console.log("response =>>>", response.data);

      console.log(
        `idBlacklist ${idBlacklist} updated to newStatus:${newStatus}`
      );
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data) {
        console.log(
          `idBlacklist ${idBlacklist} not updated to ${newStatus} err:`,
          err.response.data
        );
      } else {
        console.log("Error in updateItemToBlacklist request =>>>", err);
      }
    }
  }
}

export default Request;
