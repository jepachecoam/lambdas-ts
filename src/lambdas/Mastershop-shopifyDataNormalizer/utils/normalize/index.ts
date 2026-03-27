export const codeProvince = (provinceCode: string | null, country: string) => {
  if (!provinceCode || country !== "PE") {
    return null;
  }

  const valueExtract = `${country}-`;
  if (provinceCode.startsWith(valueExtract)) {
    return provinceCode.slice(valueExtract.length);
  }

  return provinceCode;
};
