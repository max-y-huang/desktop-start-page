
/************************* 
 * SETTINGS
 *************************/

// CSS for determining widget position.
const position = {
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, calc(-50% - 5vh))'
}

// Font settings.
const mainFont = 'Baloo Bhaijaan';
const searchBarFont = 'Helvetica Neue';

// Color settings.
const textColor = '#fff';
const shadowColor = '#0001';

// Search settings.
const showSearchBar = true;
const searchURL = 'https://www.google.com/search?q=<QUERY>';
const searchBarPlaceholder = 'Search ...';

///////////////////////////////////////////////////////////////////////////

import { css, run } from 'uebersicht';

const __dir__ = 'start-page.widget';

export const command = 'echo $(date +%a_%B_%d_%I_%M_%p)';  // deliminate time elements with '_'
export const refreshFrequency = 100;                       // update every 100ms
export const className = {                                 // root element style
  ...position,
  color: textColor,
  textAlign: 'center',
  fontFamily: mainFont
};

const styles = {
  ignoreCursor: css({
    pointerEvents: 'none',
    userSelect: 'none',
    cursor: 'default'
  }),
  useCursor: css({
    pointerEvents: 'auto',
    userSelect: 'auto',
    cursor: 'auto'
  }),
  time: css({
    fontSize: '7.5em',
    textShadow: `4px 4px ${shadowColor}`,
    lineHeight: 1,
    letterSpacing: '0.05em',
    '& > span:nth-child(2)': {  // AM/PM display
      marginLeft: '0.3em',
      fontSize: '0.33em',
      textTransform: 'uppercase',
      letterSpacing: '0.1em'
    }
  }),
  date: css({
    fontSize: '1.3em',
    textShadow: `3px 3px ${shadowColor}`,
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  }),
  search: css({
    marginTop: '3em',
    width: 540,
    height: '2.5em',
    display: 'flex',
    borderRadius: '1.25em',
    backgroundColor: textColor,
    fontFamily: searchBarFont,
    boxShadow: `0 4px 8px 0 ${shadowColor}, 0 6px 20px 0 ${shadowColor}`,
    '& > img': {  // search icon
      padding: '0.75em 0'
    },
    '& > input': {  // search text field
      margin: 0,
      padding: '0 0.75em 0 0',
      outline: 'none',
      border: 'none',
      background: 'none',
      flexGrow: 1,
      fontSize: '1.2em'
    }
  })
};

export const render = ({ output }) => {

  const [ day, month, date, hour, minute, amPm ] = output.split('_');

  const search = (event) => {
    if (event.key === 'Enter') {
      run(`open "${searchURL.replace('<QUERY>', encodeURIComponent(event.target.value))}"`);
      event.target.value = '';
      event.target.blur();
    }
  };

  return (
    <div className={styles.ignoreCursor}>
      <div className={styles.time}>
        <span>{`${Number(hour)}:${minute}`}</span>
        <span>{amPm}</span>
      </div>
      <div className={styles.date}>{`${day}, ${month} ${date}`}</div>
      {showSearchBar && (
        <div className={styles.search}>
          <img src={`${__dir__}/search-icon.svg`} />
          <input className={styles.useCursor} type='text' placeholder={searchBarPlaceholder} onKeyUp={search} />
        </div>
      )}
    </div>
  );
};
