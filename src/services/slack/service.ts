async function sendMsg(
  url: string,
  origin: string,
  payload: object
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ...payload, origin })
    });
    if (!res.ok) {
      console.error(
        `Error sending message to slack; status code: ${res.status}; ${res}`
      );
    }
  } catch (error) {
    console.error(`Error sending message to slack: ${error}`);
  }
}

export { sendMsg };
