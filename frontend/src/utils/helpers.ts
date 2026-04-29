export const formatCurrency = (amount: number) => {
  return `KES ${amount?.toLocaleString() ?? 0}`;
};

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const capitalize = (str: string) => {
  return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
};