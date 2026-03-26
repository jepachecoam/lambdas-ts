import { ShopifyDataSchema } from "../utils/schemas/schema";
import normalizeCoDto from "./normalizeCO/dto";
import normalizePeDto from "./normalizePE/dto";

type ModelDtoContract = Pick<
  typeof normalizeCoDto,
  | "normalizeOrderData"
  | "convertToOrderSchemaExpected"
  | "buildNormalizeProductsBody"
  | "buildProcessOrderBody"
>;

type SchemaContract = typeof ShopifyDataSchema;

class DtoSelector {
  private static readonly dtoByCountryCode: Record<string, ModelDtoContract> = {
    CO: normalizeCoDto,
    PE: normalizePeDto
  };

  private static readonly schemaByCountryCode: Record<string, SchemaContract> =
    {
      CO: ShopifyDataSchema,
      PE: ShopifyDataSchema
    };

  static getDtoByCountry(countryCode?: string | null): ModelDtoContract {
    const normalizedCountryCode = countryCode?.toUpperCase();

    return (
      (normalizedCountryCode &&
        DtoSelector.dtoByCountryCode[normalizedCountryCode]) ||
      normalizeCoDto
    );
  }

  static getSchemaByCountry(countryCode?: string | null): SchemaContract {
    const normalizedCountryCode = countryCode?.toUpperCase();

    return (
      (normalizedCountryCode &&
        DtoSelector.schemaByCountryCode[normalizedCountryCode]) ||
      ShopifyDataSchema
    );
  }
}

export default DtoSelector;
