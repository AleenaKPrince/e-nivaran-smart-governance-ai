export const toTitleCase = (value = "") => {
  if (!value) return "";
  return value
    .toString()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
