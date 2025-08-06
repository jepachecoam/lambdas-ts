import {
  RDSClient,
  StartDBInstanceCommand,
  StopDBInstanceCommand
} from "@aws-sdk/client-rds";

class RDSDao {
  private rdsClient: RDSClient;

  constructor() {
    this.rdsClient = new RDSClient({
      region: process.env["AWS_REGION"] || "us-east-1"
    });
  }

  async startRDSInstance(instanceId: string): Promise<void> {
    try {
      console.log(`Starting RDS instance: ${instanceId}`);

      const command = new StartDBInstanceCommand({
        DBInstanceIdentifier: instanceId
      });

      await this.rdsClient.send(command);
      console.log(`Successfully started RDS instance: ${instanceId}`);
    } catch (error) {
      console.error(`Error starting RDS instance ${instanceId}:`, error);
      throw error;
    }
  }

  async stopRDSInstance(instanceId: string): Promise<void> {
    try {
      console.log(`Stopping RDS instance: ${instanceId}`);

      const command = new StopDBInstanceCommand({
        DBInstanceIdentifier: instanceId
      });

      await this.rdsClient.send(command);
      console.log(`Successfully stopped RDS instance: ${instanceId}`);
    } catch (error) {
      console.error(`Error stopping RDS instance ${instanceId}:`, error);
      throw error;
    }
  }
}

export default RDSDao;
