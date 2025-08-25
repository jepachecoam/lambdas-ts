import axios from "axios";

export const sendSlackAlert = (payload: {
  logStreamId: string;
  message: string;
  data: any;
}) => {
  return axios.post(
    process.env["SLACK_URL_NOTIFICATION"]!,
    {
      logStreamId: payload.logStreamId,
      message: payload.message,
      data: JSON.stringify(payload.data)
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
