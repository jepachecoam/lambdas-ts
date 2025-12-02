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

export default {
  response
};
