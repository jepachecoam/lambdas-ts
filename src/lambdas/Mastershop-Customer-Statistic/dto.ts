function getParams(event: any) {
  console.log("event :>>>", JSON.stringify(event));

  const environment = "prod";
  const phone = "3024507261";

  return {
    environment: environment,
    phone: phone
  };
}

export default { getParams };
