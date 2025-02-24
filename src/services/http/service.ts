import { WithdrawalStatusEnum } from "src/shared/enums";

class HttpWalletService {
  private url: string;
  private apiKey: string;
  private appName: string;

  constructor(url: string, apiKey: string, appName: string) {
    this.url = url;
    this.apiKey = apiKey;
    this.appName = appName;
  }

  async changeWithdrawalStatus(
    withdrawalId: number,
    status: WithdrawalStatusEnum,
    sendedAt: string,
  ): Promise<void> {
    const payload = {
      idWithdrawal: withdrawalId,
      status,
      sendedAt,
    };

    const response = await fetch(`${this.url}/wallet/withdrawal/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: {
        "x-api-key": this.apiKey,
        "x-app-name": this.appName,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    if (!response.ok)
      throw new Error(
        `error updating withdrawal, ${withdrawalId}: ${JSON.stringify(data)}`,
      );
  }
}

export { HttpWalletService };
