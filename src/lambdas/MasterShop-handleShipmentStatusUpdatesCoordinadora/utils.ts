import { format } from "date-fns";

export const formatDate = ({ date }: any) => {
  return format(new Date(date), "yyyy-MM-dd HH:mm");
};

export const sanitizeStatus = ({ status }: any) => {
  const statusNormalized = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const statusSanitized = statusNormalized
    .replace(/[^a-zA-Z ]/g, "")
    .toLowerCase()
    .trim();
  console.log("Sanitized status =>>>", statusSanitized);
  return statusSanitized === "aprobacion";
};
