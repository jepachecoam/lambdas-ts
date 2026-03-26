const getParams = (event: any) => {
  const shopifyOrderId = event.id;
  const shopifyAccessToken = event["X-Shopify-Access-Token"];

  const shopifyStoreUrl = event["X-Shopify-Url-Store"];
  const msApiKey = event.msApiKey;
  const configTool = {
    idUser: event.configTool?.idUser,
    idConfTool: event.configTool?.idConfTool
  };
  return {
    shopifyAccessToken,
    shopifyStoreUrl,
    shopifyOrderId,
    environment: event.requestContext?.stage ?? "prod",
    msApiKey,
    configTool
  };
};

export default { getParams };
