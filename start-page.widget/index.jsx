
/************************* 
 * SETTINGS
 *************************/

// CSS for determining widget position.
const position = {
  top: '30%',
  left: '50%',
  transform: 'translateX(-50%)'
};

// Theme can be 'light' or 'dark'.
const theme = 'light';

// Font settings.
const mainFont = 'Baloo Bhaijaan';
const searchBarFont = 'Helvetica Neue';

// Search settings.
const showSearchBar = true;
const searchURL = 'https://www.google.com/search?q=<QUERY>';
const searchBarPlaceholder = 'Google search ...';

///////////////////////////////////////////////////////////////////////////

import { css, run } from 'uebersicht';

const __dir__ = 'start-page.widget';
const historySrc = `${__dir__}/history`;

export const refreshFrequency = 100;                       // update every 100ms
export const className = {                                 // root element style
  ...position,
  textAlign: 'center',
  fontFamily: mainFont
};

const colorTheme = {
  light: {
    dateTime: '#fff',
    shadow: '#0001',
    search: {
      text: '#000',
      placeholder: '#aaa',
      background: '#fff',
      backgroundHover: '#eee',
      divider: '#aaa',
      icon: 'brightness(0)'
    }
  },
  dark: {
    dateTime: '#000',
    shadow: '#fff1',
    search: {
      text: '#fff',
      placeholder: '#777',
      background: '#111',
      backgroundHover: '#222',
      divider: '#777',
      icon: 'brightness(1)'
    }
  }
}

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
    color: colorTheme[theme].dateTime,
    fontSize: '7.5em',
    textShadow: `4px 4px ${colorTheme[theme].shadow}`,
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
    color: colorTheme[theme].dateTime,
    fontSize: '1.3em',
    textShadow: `3px 3px ${colorTheme[theme].shadow}`,
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  }),
  search: css({
    marginTop: '3em',
    borderRadius: '1.25em',
    backgroundColor: colorTheme[theme].search.background,
    overflow: 'hidden',
    color: colorTheme[theme].search.text,
    fontFamily: searchBarFont,
    boxShadow: `0 4px 8px 0 ${colorTheme[theme].shadow}, 0 6px 20px 0 ${colorTheme[theme].shadow}`,
  }),
  searchBar: css({
    width: 540,
    height: '2.5em',
    display: 'flex',
    '& > img': {  // search icon
      padding: '0.75em 0',
      filter: colorTheme[theme].search.icon
    },
    '& > input[type="search"]': {  // search text field
      margin: 0,
      padding: '0 0.75em 0 0',
      outline: 'none',
      border: 'none',
      background: 'none',
      color: 'inherit',
      flexGrow: 1,
      fontSize: '1.2em',
      '&::placeholder': {
        color: colorTheme[theme].search.placeholder
      }
    }
  }),
  searchSuggestions: css({
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    '&:before': {
      content: '""',
      display: 'block',
      width: 'calc(100% - 2.5em)',
      marginLeft: '1.25em',
      borderTop: `1px solid ${colorTheme[theme].search.divider}`
    },
    '& > li': {
      display: 'flex',
      alignItems: 'center',
      margin: 0,
      padding: '0 0.75em 0 2.5em',
      height: '2.5em',
      cursor: 'default',
      transition: 'background-color 0.15s ease-in',
      '&:hover': {
        backgroundColor: colorTheme[theme].search.backgroundHover
      }
    }
  })
};

export const initialState = {
  time: [],
  suggestions: []
};

const updateTime = (dispatch, time) => dispatch({ type: 'UPDATE_TIME', data: time });
const updateSuggestions = (dispatch, suggestions) => dispatch({ type: 'UPDATE_SUGGESTIONS', data: suggestions });

export const command = (dispatch) => {
  run('echo $(date +%a_%B_%d_%I_%M_%p)').then((res) => {  // poll for datetime, delimit with '_'
    updateTime(dispatch, res.split('_'));
  });
};

export const updateState = (event, previousState) => {
  switch(event.type) {
    case 'UPDATE_TIME': return { ...previousState, time: event.data };
    case 'UPDATE_SUGGESTIONS': return { ...previousState, suggestions: event.data };
    default: return previousState;
  }
};

export const render = ({ time, suggestions }, dispatch) => {

  const [ day, month, date, hour, minute, amPm ] = time;

  const showSuggestionsFlag = () => (document.activeElement.id === 'searchInput') && (suggestions.length > 0);

  const assertFile = (src) => {
    run(`if [ ! -f "${src}" ]; then touch ${src}; fi`);
  };

  const updateHistory = (search) => {
    assertFile(historySrc);
    return new Promise((resolve) => {
      search = encodeURIComponent(search);
      // updates history with move-to-front heuristic
      run(`cat "${historySrc}"`).then((history) => {
        const withoutLastSearch = history.trim().split('\n').filter((item) => item.toLowerCase() !== search.toLowerCase());
        const newHistory = [ search, ...withoutLastSearch].join('\n');
        run(`echo "${newHistory}" > ${historySrc}`).then(() => {
          resolve();
        });
      });
    });
  };

  const getSuggestions = async (query) => {
    assertFile(historySrc);
    return new Promise((resolve) => {
      query = encodeURIComponent(query);
      run(`grep -F -i "${query}" "${historySrc}"`).then((items) => {
        const suggestions = (items === '') ? [] : items.trim().split('\n').map((item) => decodeURIComponent(item));
        resolve(suggestions);
      });
    });
  };

  const showSuggestions = (query) => {   
    if (query === '') {
      updateSuggestions(dispatch, []);
    }
    else {
      getSuggestions(query).then((suggestions) => {
        updateSuggestions(dispatch, suggestions);
      });
    }
  };

  const search = (query) => {
    const searchInputDOM = document.querySelector('#searchInput');
    run(`open "${searchURL.replace('<QUERY>', encodeURIComponent(query))}"`);  // search for query
    updateHistory(query).then(() => {
      searchInputDOM.value = '';
      searchInputDOM.blur();
      updateSuggestions(dispatch, []);
    });
  };
  
  const onSearchInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search(event.target.value);
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
        <div id='searchContainer' className={styles.search}>
          <div className={styles.searchBar}>
            <img src={`${__dir__}/search-icon.svg`} />
            <input
              type='search'
              id='searchInput'
              className={styles.useCursor}
              spellCheck={false}
              placeholder={searchBarPlaceholder}
              onKeyDown={onSearchInputKeyDown}
              onChange={(event) => showSuggestions(event.target.value)}
            />
          </div>
          {showSuggestionsFlag() && (
            <ul className={styles.searchSuggestions}>
              {suggestions.map((suggestion) => (
                <li
                  className={styles.useCursor}
                  onMouseDown={(event) => event.preventDefault()}  // prevent loss of focus
                  onClick={() => search(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
