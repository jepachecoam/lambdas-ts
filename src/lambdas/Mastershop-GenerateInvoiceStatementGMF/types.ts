import { dbEnv } from "../../shared/types/database";

export type CustomerDeduplicationEnvs = Record<keyof typeof dbEnv, string>;
