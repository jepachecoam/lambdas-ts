function getRecords(event: any) {
  console.log("event :>>>", JSON.stringify(event));

  const records = event["Records"].map((record: any) => {
    const body = JSON.parse(record.body);
    return body;
  });

  return records;
}

export default { getRecords };
