export const getRentalDays = (startDate: Date, endDate: Date): number => {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const difference = endDate.getTime() - startDate.getTime();

  return Math.ceil(difference / millisecondsPerDay);
};
