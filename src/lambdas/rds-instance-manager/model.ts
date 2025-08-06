import RDSDao from "./dao";

class Model {
  private rdsDao: RDSDao;

  constructor() {
    this.rdsDao = new RDSDao();
  }

  async manageRDSInstances(params: {
    action: string;
    rdsArns: string[];
  }): Promise<void> {
    console.log("params =>>>", params);

    const { action, rdsArns } = params;
    const results = [];

    for (const arn of rdsArns) {
      try {
        const instanceId = this.extractInstanceIdFromArn(arn);
        console.log(
          `Processing ${action} for instance: ${instanceId} (ARN: ${arn})`
        );

        switch (action) {
          case "start":
            await this.rdsDao.startRDSInstance(instanceId);
            results.push({ instanceId, status: "started", success: true });
            break;
          case "stop":
            await this.rdsDao.stopRDSInstance(instanceId);
            results.push({ instanceId, status: "stopped", success: true });
            break;
          default:
            console.log("Action not found");
            throw new Error("Action not found");
        }
      } catch (error) {
        console.error(`Error processing instance ${arn}:`, error);
        results.push({
          instanceId: this.extractInstanceIdFromArn(arn),
          status: "error",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    console.log("Processing results =>>>", results);
  }

  private extractInstanceIdFromArn(arn: string): string {
    // ARN format: arn:aws:rds:region:account:db:instance-name
    const parts = arn.split(":");
    if (parts.length < 6) {
      throw new Error(`Invalid RDS ARN format: ${arn}`);
    }
    return parts[parts.length - 1];
  }
}

export default Model;
