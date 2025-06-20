export const xlsxResponse = ({
  buffer,
  filename
}: {
  buffer: Buffer;
  filename: string;
}) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}.xlsx`
    },
    isBase64Encoded: true,
    body: buffer.toString("base64")
  };
};
