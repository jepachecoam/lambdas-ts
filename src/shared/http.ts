const jsonResponse = ({
  statusCode,
  message,
  result
}: {
  statusCode: number;
  message: string;
  result: any;
}) => {
  return {
    statusCode,
    body: JSON.stringify({ message, result })
  };
};

export default { jsonResponse };
