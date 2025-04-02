export const formattedDate = new Date()
  .toISOString()
  .slice(0, 16)
  .replace("T", " ");
