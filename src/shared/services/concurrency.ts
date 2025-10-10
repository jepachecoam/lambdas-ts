import pLimit from "p-limit";

const executeWithLimit = async ({
  tasks,
  concurrencyLimit
}: {
  tasks: (() => Promise<any>)[];
  concurrencyLimit: number;
}) => {
  const limit = pLimit(concurrencyLimit);
  const limitedTasks = tasks.map((task) => limit(task));

  const results = await Promise.allSettled(limitedTasks);

  const rejectedCount = results.filter(
    (result) => result.status === "rejected"
  ).length;

  const totalTasks = results.length;
  const fulfilledCount = totalTasks - rejectedCount;

  console.log(`fulfilled tasks: ${fulfilledCount} of ${totalTasks}`);

  return {
    successfulOperations: results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value),
    haveErrors: rejectedCount > 0
  };
};

export default {
  executeWithLimit
};
