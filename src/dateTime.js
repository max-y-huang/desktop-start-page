import { run } from 'uebersicht';

export const getDateTimeData = async (twentyFourHourClock) => {
  const hourFlag = twentyFourHourClock ? '%H' : '%I';
  const data = await run(`echo $(date +%a_%B_%d_${hourFlag}_%M_%p)`);  // separate data with '_'
  const [ day, month, date, hour, minute, amPm ] = data.split('_');
  return ({ day, month, date, hour, minute, amPm });
}
