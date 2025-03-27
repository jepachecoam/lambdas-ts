const parseParams = (params: any) => {
  console.log("params =>>>", params);

  const environment = params["stage"];
  if (!environment || !["dev", "prod"].includes(environment)) {
    throw new Error("stage not found");
  }
  return environment;
};

export default { parseParams };
