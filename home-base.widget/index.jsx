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
const searchEngineURL = 'https://www.google.com/search?q=<QUERY>';


////////////////// END OF USER SETTINGS. DO NOT EDIT FURTHER //////////////////


import { c, makeStyles } from './src/funcs';
import { getDateTimeData } from './src/dateTime';
import { searchQuery, updateHistory, getSuggestions } from './src/search';

const searchModes = [
  {
    mode: 'search',
    iconSrc: 'home-base.widget/src/imgs/searchIcon.svg',
    historySrc: 'home-base.widget/.searchHistory',
    searchPlaceholder: 'Search ...'
  },
  {
    mode: 'web',
    iconSrc: 'home-base.widget/src/imgs/webIcon.svg',
    historySrc: 'home-base.widget/.webHistory',
    searchPlaceholder: 'https:// ...'
  }
];

// styles
export const className = { ...position };  // root element style
const styles = makeStyles(theme);

// handle polling
export const refreshFrequency = 100;  // in milliseconds
export const command = async (dispatch) => {
  const data = await getDateTimeData();
  dispatch({ type: 'time', data });
};

// handle state management
export const initialState = { time: [], suggestions: [], searchMode: 0 };
export const updateState = (event, prevState) => ({ ...prevState, [event.type]: event.data });

// handle render
export const render = ({ time, suggestions, searchMode }, dispatch) => {

  const focusOnTabIndex = (tabIndex) => {
    const tabbableDOMs = document.querySelectorAll('.arrowTabbable');
    for (let i = 0; i < tabbableDOMs.length; i++) {
      if (tabbableDOMs[i].tabIndex === tabIndex) {
        tabbableDOMs[i].focus();
        break;
      }
    }
  }

  const showSuggestionsFlag = () => {
    return (document.querySelector('#searchContainer')?.contains(document.activeElement)) && (suggestions.length > 0);
  };

  const showSuggestions = async (query, mode = searchMode) => {
    if (query === '') {  // edge case with empty query (since everything matches with '')
      dispatch({ type: 'suggestions', data: [] });
    }
    else {
      let suggestions = await getSuggestions(query, searchModes[mode].mode, searchModes[mode].historySrc);
      if (maxSuggestions >= 0) {
        suggestions = suggestions.slice(0, maxSuggestions);
      }
      dispatch({ type: 'suggestions', data: suggestions });
    }
  };

  const clearSearch = () => {
    const searchInputDOM = document.querySelector('#searchInput');
    searchInputDOM.value = '';
    showSuggestions('');
  }

  const search = async (query, mode = searchMode) => {
    await searchQuery(query, searchModes[mode].mode, searchEngineURL);
    await updateHistory(query, searchModes[mode].historySrc);
    clearSearch();
  };

  const goToNextSearchMode = () => {
    const searchInputDOM = document.querySelector('#searchInput');
    const nextMode = (searchMode + 1) % searchModes.length;
    dispatch({ type: 'searchMode', data: nextMode });
    showSuggestions(searchInputDOM.value, nextMode);
  }

  const onSearchElementKeyDown = (event, query) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search(query);
      event.target.blur();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      clearSearch();
      event.target.blur();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOnTabIndex(event.target.tabIndex - 1);
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOnTabIndex(event.target.tabIndex + 1);
    }
    if (event.key === 'Backspace') {
      const searchInputDOM = document.querySelector('#searchInput');
      searchInputDOM.focus();
      // do not prevent default => backspace in searchInputDOM
    }
  };

  const onSearchBarKeyDown = (event) => {
    onSearchElementKeyDown(event, event.target.value);
    if (event.key === 'Tab') {
      goToNextSearchMode();
    }
  }

  const { day, month, date, hour, minute, amPm } = time;
  return (
    <div className={c(styles.ignoreCursor, styles.container)}>
      <div className={styles.time}>
        <span>{`${Number(hour)}:${minute}`}</span>
        <span>{amPm}</span>
      </div>
      <div className={styles.date}>{`${day}, ${month} ${date}`}</div>
      {showSearchBar && (
        <div id='searchContainer' className={styles.search}>
          <div className={styles.searchBar}>
            {/* <button className={styles.useCursor}  onClick={goToNextSearchMode}> */}
              <img src={searchModes[searchMode].iconSrc} draggable={false} />
            {/* </button> */}
            <input
              type='search'
              id='searchInput'
              tabIndex={1}
              className={c(styles.useCursor, 'arrowTabbable')}
              spellCheck={false}
              placeholder={searchModes[searchMode].searchPlaceholder}
              onKeyDown={onSearchBarKeyDown}
              onChange={(event) => showSuggestions(event.target.value)}
            />
          </div>
          {showSuggestionsFlag() && (
            <ul className={styles.searchSuggestions}>
              {suggestions.map(({ suggestion, fromHistory }, i) => (
                <li
                  key={suggestion}
                  tabIndex={i + 2}  // tabIndex=1 taken by search input => start at tabIndex=2
                  className={c(styles.useCursor, 'arrowTabbable', fromHistory ? 'fromHistory' : null)}
                  onMouseDown={(event) => event.preventDefault()}  // prevent loss of focus
                  onKeyDown={(event) => onSearchElementKeyDown(event, suggestion)}
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
