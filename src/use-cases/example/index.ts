export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<any> => {
  console.log("hello word from lambda");

  return response({
    statusCode: 200,
    message: "hello word from lambda",
    result: {}
  });
};

const response = ({
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
