import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

class Dao {
  private environmentName: string;
  private stateMachineArn: string;
  private sfnClient: SFNClient;

  constructor(environment: string) {
    this.sfnClient = new SFNClient();
    this.environmentName = environment;
    this.stateMachineArn =
      process.env[`STEP_FUNCTION_ARN_${this.environmentName.toUpperCase()}`]!;
  }

  async startStepFnExecution(event: any) {
    try {
      const startCommand = new StartExecutionCommand({
        stateMachineArn: this.stateMachineArn,
        input: JSON.stringify(event)
      });

      await this.sfnClient.send(startCommand);
    } catch (error: any) {
      console.error("Error in startStepFnExecution dao =>>>", error);
      throw error;
    }
  }
}
export default Dao;
