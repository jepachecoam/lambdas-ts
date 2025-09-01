export const cleanDataForSQL = (data: any): any => {
  if (typeof data === "string") {
    return data
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "''")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t")
      .replace(/\0/g, "\\0")
      .replace(/--/g, "- -")
      .replace(/#/g, "# ")
      .replace(/;/g, "; ")
      .replace(/\*/g, "* ")
      .replace(/\//g, "/ ")
      .replace(/\+/g, "+ ");
  }

  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => cleanDataForSQL(item));
    }

    const cleanedObj: any = {};
    for (const [key, value] of Object.entries(data)) {
      cleanedObj[key] = cleanDataForSQL(value);
    }
    return cleanedObj;
  }

  return data;
};
