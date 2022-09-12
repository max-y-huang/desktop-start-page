/*******************************************************
 * DESKTOP START PAGE
 * Edit the settings below
 *******************************************************/

// CSS for determining widget position
const position = {
  top: '30%',
  left: '50%',
  transform: 'translateX(-50%)'
};

// select theme from theme.json
const theme = 'light';

// search settings
const showSearchBar = true;
const maxSuggestions = 6;  // set to -1 for unlimited suggestions
const searchURL = 'https://www.google.com/search?q=<QUERY>';
const searchBarPlaceholder = 'Google search ...';


////////////////// END OF USER SETTINGS. DO NOT EDIT FURTHER //////////////////


/************************* 
 * SYSTEM SETTINGS
 *************************/

import { run, css } from 'uebersicht';
import stylesTemplate from './styles.json';
import themes from './themes.json';

// source files
const searchIconSrc = 'start-page.widget/search-icon.svg';
const historySrc = 'start-page.widget/history';

/************************* 
 * BUSINESS LOGIC
 *************************/

const objectMap = (obj, fn) => {
  return Object.fromEntries(Object.entries(obj).map(([key, val]) => [key, fn(val)]));
};

const assertFile = (src) => {
  run(`if [ ! -f "${src}" ]; then touch ${src}; fi`);
};

const getDateTimeData = () => {
  return new Promise((resolve) => {
    run('echo $(date +%a_%B_%d_%I_%M_%p)').then((data) => {  // separate data with '_'
      const [day, month, date, hour, minute, amPm] = data.split('_');
      resolve({ day, month, date, hour, minute, amPm });
    });
  });
}

const searchQuery = (query) => {
  run(`open "${searchURL.replace('<QUERY>', encodeURIComponent(query))}"`);
}

const updateHistory = (query, file) => {
  assertFile(file);
  return new Promise((resolve) => {
    query = encodeURIComponent(query);
    // update history with move-to-front heuristic
    run(`cat "${file}"`).then((oldHistory) => {
      const filtered = oldHistory.trim().split('\n').filter((item) => item.toLowerCase() !== query.toLowerCase());
      const history = [query, ...filtered].join('\n');
      run(`echo "${history}" > ${file}`).then(() => {
        resolve();
      });
    });
  });
};

const getSuggestions = async (query, file) => {
  assertFile(file);
  return new Promise((resolve) => {
    query = encodeURIComponent(query);
    run(`grep -F -i "${query}" "${file}"`).then((items) => {
      let suggestions = [];
      if (items !== '') {  // '' is an edge case that returns [ '' ] if handled
        suggestions = items.trim().split('\n').map((item) => decodeURIComponent(item));
      }
      resolve(suggestions);
    });
  });
};

/************************* 
 * STYLING LOGIC
 *************************/

const makeStyles = () => {
  const themeData = themes[theme];  // used in eval step
  const pattern = /<[^>]*>/;        // pattern to evaluate: <EXPRESSION>
  let s = JSON.stringify(stylesTemplate);
  while (s.match(pattern)) {
    const match = s.match(pattern)[0];
    s = s.replace(match, eval('themeData.' + match.slice(1, -1)));
  }
  return objectMap(JSON.parse(s), css);
}

export const className = { ...position };  // root element style
const styles = makeStyles();

/************************* 
 * UI LOGIC
 *************************/

// handle polling
export const refreshFrequency = 100;  // in milliseconds
export const command = (dispatch) => {
  getDateTimeData().then((data) => {
    dispatch({ type: 'time', data });
  });
};

// handle state management
export const initialState = { time: [], suggestions: [] };
export const updateState = (event, prevState) => ({ ...prevState, [event.type]: event.data });

// handle render
export const render = ({ time, suggestions }, dispatch) => {

  const showSuggestionsFlag = () => {
    return (document.querySelector('#searchContainer')?.contains(document.activeElement)) && (suggestions.length > 0);
  };

  const showSuggestions = (query) => {
    if (query === '') {  // edge case with empty query (since everything matches with '')
      dispatch({ type: 'suggestions', data: [] });
    }
    else {
      getSuggestions(query, historySrc).then((data) => {
        let suggestions = data;
        if (maxSuggestions >= 0) {
          suggestions = suggestions.slice(0, maxSuggestions);
        }
        dispatch({ type: 'suggestions', data: suggestions });
      });
    }
  };

  const search = (query) => {
    const searchInputDOM = document.querySelector('#searchInput');
    searchQuery(query);
    updateHistory(query, historySrc).then(() => {
      searchInputDOM.value = '';
      searchInputDOM.blur();
      showSuggestions('');
    });
  };

  const onSearchInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search(event.target.value);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.target.blur();
    }
  };

  const onSearchSuggestionKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.target.click();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.target.blur();
    }
  }

  const { day, month, date, hour, minute, amPm } = time;
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
            <img src={searchIconSrc} />
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
              {suggestions.map((suggestion, i) => (
                <li
                  key={suggestion}
                  tabIndex={0}
                  className={styles.useCursor}
                  onMouseDown={(event) => event.preventDefault()}  // prevent loss of focus
                  onKeyDown={onSearchSuggestionKeyDown}
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
