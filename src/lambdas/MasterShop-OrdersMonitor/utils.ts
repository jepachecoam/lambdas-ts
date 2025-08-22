import pLimit from "p-limit";

const executeWithLimit = async ({
  tasks,
  concurrencyLimit,
  logReference
}: any) => {
  const limit = pLimit(concurrencyLimit);
  const limitedTasks = tasks.map((task: any) => limit(task));

  const results = await Promise.allSettled(limitedTasks);

  const rejectedCount = results.filter(
    (result) => result.status === "rejected"
  ).length;

  const totalTasks = results.length;
  const fulfilledCount = totalTasks - rejectedCount;

  console.log(
    `fulfilled tasks: ${fulfilledCount} of ${totalTasks} in ${logReference}`
  );

  return {
    successfulOperations: results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value),
    haveErrors: rejectedCount > 0
  };
};

const response = ({
  statusCode,
  message
}: {
  statusCode: number;
  message: string;
}) => {
  return {
    statusCode,
    body: JSON.stringify({
      message: message
    })
  };
};

export default {
  executeWithLimit,
  response
};
