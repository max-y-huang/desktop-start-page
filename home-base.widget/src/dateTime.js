import { run } from 'uebersicht';

export const getDateTimeData = () => {
  return new Promise((resolve) => {
    run('echo $(date +%a_%B_%d_%I_%M_%p)').then((data) => {  // separate data with '_'
      const [ day, month, date, hour, minute, amPm ] = data.split('_');
      resolve({ day, month, date, hour, minute, amPm });
    });
  });
}
