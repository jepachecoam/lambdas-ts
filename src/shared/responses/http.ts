const httpResponse = ({
  statusCode,
  body
}: {
  statusCode: number;
  body: any;
}) => {
  return {
    statusCode,
    body: JSON.stringify(body)
  };
};

export default httpResponse;
