import { UniqueIdOptions } from "./types";

const response = ({
  statusCode,
  message
}: {
  statusCode: number;
  message: string;
}) => {
  return {
    statusCode,
    body: JSON.stringify({
      message: message
    })
  };
};

const generateId = (options: UniqueIdOptions): string => {
  const {
    prefix = "MSKD89S",
    variableLength = 4,
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  } = options;

  const generateRandomString = (length: number): string => {
    return Array.from({ length }, () =>
      characters!.charAt(Math.floor(Math.random() * characters.length))
    ).join("");
  };

  return `${prefix}${generateRandomString(variableLength!)}`;
};

export default {
  response,
  generateId
};
