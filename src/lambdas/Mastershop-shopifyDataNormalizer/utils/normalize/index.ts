export const codeProvince = (
  provinceCode: string | null,
  valueExtract: string
) => {
  if (!provinceCode) {
    return null;
  }

  if (provinceCode.startsWith(valueExtract)) {
    return provinceCode.slice(valueExtract.length);
  }

  return provinceCode;
};
