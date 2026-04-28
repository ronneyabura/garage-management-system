// Generate sequential job card numbers like JC-2024-001234
export const generateJobNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `JC-${year}-${random}`;
};
