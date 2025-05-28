import dto from "./dto";
import model from "./model";
export const handler = async (event: any, _context: any) => {
  try {
    console.log("event =>>>", JSON.stringify(event));

    const records = dto.parseEvent(event);

    await model.processRecords(records);
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};
