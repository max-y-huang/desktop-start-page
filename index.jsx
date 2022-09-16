/*******************************************************************************
 * HOME BASE
 * A date time and search bar widget powered by Übersicht.
 * 
 * Edit "User Settings" in this file for customization options.
 * Edit themes in themes.json.
 * See README.md for more info.
 *******************************************************************************/

////////// START OF USER SETTINGS. EDIT BELOW. /////////////////////////////////

// CSS for determining widget position
const position = {
  top: '30%',
  left: '50%',
  transform: 'translateX(-50%)'
};

// select theme from themes.json
const theme = 'light';

// date time settings
const twentyFourHourClock = false;

// search settings
const showSearchBar = true;
const maxSuggestions = 6;  // set to -1 for unlimited suggestions
const searchEngineURL = 'https://www.google.com/search?q=<QUERY>';

////////// END OF USER SETTINGS. DO NOT EDIT FURTHER. //////////////////////////


import { c, makeStyles } from './src/funcs';
import { getDateTimeData } from './src/dateTime';
import { searchQuery, addQueryToHistory, getSuggestions, removeQueryFromHistory } from './src/search';

const closeIconSrc = './home-base/src/imgs/closeIcon.svg';

const searchModes = [
  {
    mode: 'search',
    iconSrc: './home-base/src/imgs/searchIcon.svg',
    historySrc: './home-base/.searchHistory',
    searchPlaceholder: 'Search ...'
  },
  {
    mode: 'web',
    iconSrc: './home-base/src/imgs/webIcon.svg',
    historySrc: './home-base/.webHistory',
    searchPlaceholder: 'https:// ...'
  }
];

// styles
export const className = { ...position };  // root element style
const styles = makeStyles(theme);

// handle polling
export const refreshFrequency = 100;  // in milliseconds
export const command = async (dispatch) => {
  const data = await getDateTimeData(twentyFourHourClock);
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
    let show = document.querySelector('#searchContainer')?.contains(document.activeElement)
    show = show && (suggestions.length > 0)
    return show;
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

  const deleteSuggestion = async (query, mode = searchMode) => {
    const searchInputDOM = document.querySelector('#searchInput');
    await removeQueryFromHistory(query, searchModes[mode].historySrc);
    await showSuggestions(searchInputDOM.value, mode);
  }

  const clearSearch = () => {
    const searchInputDOM = document.querySelector('#searchInput');
    searchInputDOM.value = '';
    showSuggestions('');
  }

  const search = async (query, mode = searchMode) => {
    await searchQuery(query, searchModes[mode].mode, searchEngineURL);
    await addQueryToHistory(query, searchModes[mode].historySrc);
    clearSearch();
  };

  const goToNextSearchMode = () => {
    const searchInputDOM = document.querySelector('#searchInput');
    const nextMode = (searchMode + 1) % searchModes.length;
    dispatch({ type: 'searchMode', data: nextMode });
    showSuggestions(searchInputDOM.value, nextMode);
  }

  const onSearchElementKeyDown = (event, query) => {
    const searchInputDOM = document.querySelector('#searchInput');
    if (event.key === 'Enter') {  // search query
      event.preventDefault();
      search(query);
      event.target.blur();
    }
    if (event.key === 'Escape') {  // clears and exits search bar
      event.preventDefault();
      clearSearch();
      event.target.blur();
    }
    if (event.key === 'Tab') {  // switches search mode
      event.preventDefault();
      searchInputDOM.focus();
      goToNextSearchMode();
    }
    if (event.key === 'ArrowUp') {  // scroll up through suggestions/search input
      event.preventDefault();
      focusOnTabIndex(event.target.tabIndex - 1);
    }
    if (event.key === 'ArrowDown') {  // scroll down through suggestions/search input
      event.preventDefault();
      focusOnTabIndex(event.target.tabIndex + 1);
    }
  };

  const onSuggestionKeyDown = (event, query, fromHistory) => {
    onSearchElementKeyDown(event, query);
    if (fromHistory) {
      if (event.key === 'Backspace') {  // deletes search history item
        event.preventDefault();
        focusOnTabIndex(event.target.tabIndex - 1);
        deleteSuggestion(query);
      }
    }
  }

  const onDeleteHistoryButtonClick = async (event, query) => {
    event.stopPropagation();
    deleteSuggestion(query);
  }

  const { day, month, date, hour, minute, amPm } = time;

  const renderDateTime = () => {
    return (
      <div className={styles.dateTime}>
        <div className={styles.time}>
          <span>{`${Number(hour)}:${minute}`}</span>
          <span>{twentyFourHourClock ? null : amPm}</span>
        </div>
        <div className={styles.date}>{`${day}, ${month} ${date}`}</div>
      </div>
    );
  }

  const renderSuggestions = () => {
    return (
      <ul className={styles.searchSuggestions}>
        {suggestions.map(({ suggestion, fromHistory }, i) => (
          <li
            key={suggestion}
            tabIndex={i + 2}  // tabIndex=1 taken by search input => start at tabIndex=2
            className={c(styles.useCursor, 'arrowTabbable', fromHistory ? 'fromHistory' : null)}
            onMouseDown={(event) => event.preventDefault()}  // prevent loss of focus
            onKeyDown={(event) => onSuggestionKeyDown(event, suggestion, fromHistory)}
            onClick={() => search(suggestion)}
          >
            <span>{suggestion}</span>
            <button
              className={styles.searchIconButton}
              onClick={(event) => onDeleteHistoryButtonClick(event, suggestion)}
            >
              <img src={closeIconSrc} draggable={false} />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const renderSearchBar = () => {
    return (
      <div id='searchContainer' className={styles.search}>
        <div className={styles.searchBar}>
          <button className={c(styles.useCursor, styles.searchIconButton)} onClick={goToNextSearchMode}>
            <img src={searchModes[searchMode].iconSrc} draggable={false} />
          </button>
          <input
            type='text'
            id='searchInput'
            tabIndex={1}
            className={c(styles.useCursor, 'arrowTabbable')}
            spellCheck={false}
            placeholder={searchModes[searchMode].searchPlaceholder}
            onKeyDown={(event) => onSearchElementKeyDown(event, event.target.value)}
            onChange={(event) => showSuggestions(event.target.value)}
          />
        </div>
        {showSuggestionsFlag() && renderSuggestions()}
      </div>
    );
  }

  return (
    <div className={c(styles.ignoreCursor, styles.container)}>
      {renderDateTime()}
      {showSearchBar && renderSearchBar()}
    </div>
  );
};
