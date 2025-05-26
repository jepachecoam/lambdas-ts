export interface AddItemToBlacklistParams {
  idBlacklistEntityType: number;
  idEntity: string | number;
  idReference: string | number;
  idBlacklistReason: number;
}

export interface UpdateItemToBlacklistParams {
  idBlacklist: string | number;
  newStatus: string;
}

export type AddUserToBlacklistParams = {
  idBlacklistReason: number;
  idBusiness: number;
  idUser: number;
};

export enum statusType {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}
