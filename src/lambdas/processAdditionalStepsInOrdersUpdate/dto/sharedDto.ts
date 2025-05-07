const extractParamsFromEvent = (event: any) => {
  const eventProcess = event["eventProcess"];
  const carrier = String(event["detail-type"]).toLocaleLowerCase();
  const detail = event["detail"];
  return {
    carrier,
    detail,
    eventProcess
  };
};

const getTrackingNumbersFromText = ({ text, exclusions, config }: any) => {
  if (!text) return [];

  const { startWith, length } = config;

  const startWithPatterns = startWith.map((prefix: any) => {
    const remainingLength = length - prefix.length;
    return `${prefix}\\d{${remainingLength}}`;
  });

  const guideRegex = new RegExp(
    `\\b(?:${startWithPatterns.join("|")})\\b`,
    "g"
  );

  const matches = text.match(guideRegex) || [];

  return matches.filter((number: any) => !exclusions.includes(number));
};

export default { extractParamsFromEvent, getTrackingNumbersFromText };
