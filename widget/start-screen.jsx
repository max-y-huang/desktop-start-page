
/************************* 
 * SETTINGS
 *************************/

const showSearchBar = true;

const mainFont = 'Baloo Bhaijaan';
const searchBarFont = 'Helvetica Neue';

const color = '#fff';
const shadowColor = '#0001';

const searchURL = 'https://www.google.com/search?q={QUERY}';
const searchBarPlaceholder = 'Search ...';

///////////////////////////////////////////////////////////////////////////

import { css, run } from 'uebersicht';

export const command = 'echo $(date +%a_%B_%d_%I_%M_%p)';  // deliminate time elements with '_'
export const refreshFrequency = 100;                       // update every 100ms

const styles = {
  ignoreCursor: css`
    pointer-events: none;
    user-select: none;
    cursor: default;
  `,
  useCursor: css`
    pointer-events: auto;
    user-select: auto;
    cursor: auto;
  `,
  wrapper: css`
    display: flex;
    width: 100vw;
    height: 100vh;
    align-items: center;
    justify-content: center;
  `,
  container: css`
    margin-top: -10vh;
    color: ${color};
    text-align: center;
    font-family: ${mainFont};
  `,
  time: css`
    font-size: 7.5em;
    font-weight: 700;
    text-shadow: 4px 4px ${shadowColor};
    line-height: 1;
    letter-spacing: 0.05em;
  `,
  amPm: css`
    margin-left: 0.3em;
    font-size: 0.33em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  `,
  date: css`
    font-size: 1.3em;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 3px 3px ${shadowColor};
  `,
  searchContainer: css`
    margin-top: 3em;
    width: 540px;
    height: 2.5em;
    display: flex;
    border-radius: 1.25em;
    box-shadow: 0 4px 8px 0 ${shadowColor}, 0 6px 20px 0 ${shadowColor};
    background-color: #fff;
    font-family: ${searchBarFont};
  `,
  searchInput: css`
    margin: 0;
    padding: 0 0.75em 0 0;
    outline: none;
    border: none;
    background: none;
    flex-grow: 1;
    font-size: 1.2em;
  `,
};

function c() { return [...arguments].join(' '); } // lets className take a list of classes; cannot be ES6 style function

export const render = ({ output }) => {

  const [ day, month, date, hour, minute, amPm ] = output.split('_');

  const search = (event) => {
    if (event.key === 'Enter') {
      const searchInputDOM = document.querySelector('#searchInput');
      run(`open "${searchURL.replace('{QUERY}', encodeURIComponent(searchInputDOM.value))}"`);
      searchInputDOM.value = '';
    }
  };

  return (
    <div className={c(styles.wrapper, styles.ignoreCursor)}>
      <div className={styles.container}>
        <div className={styles.time}>
          <span>{`${Number(hour)}:${minute}`}</span>
          <span className={styles.amPm}>{amPm}</span>
        </div>
        <div className={styles.date}>{`${day}, ${month} ${date}`}</div>
        {showSearchBar && (
          <div className={styles.searchContainer}>
            <img src="start-screen__search-icon.svg" style={{ padding: '0.75em 0' }} />
            <input id='searchInput' className={c(styles.searchInput, styles.useCursor)} type='text' placeholder={searchBarPlaceholder} onKeyUp={search} />
          </div>
        )}
      </div>
    </div>
  );
};
