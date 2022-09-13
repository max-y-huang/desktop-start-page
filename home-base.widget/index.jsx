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


import { makeStyles } from './src/funcs';
import { getDateTimeData } from './src/dateTime';
import { searchQuery, updateHistory, getSuggestions } from './src/search';

// source files
const searchIconSrc = 'home-base.widget/src/imgs/searchIcon.svg';
const historySrc = 'home-base.widget/.history';

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
export const initialState = { time: [], suggestions: [] };
export const updateState = (event, prevState) => ({ ...prevState, [event.type]: event.data });

// handle render
export const render = ({ time, suggestions }, dispatch) => {

  const showSuggestionsFlag = () => {
    return (document.querySelector('#searchContainer')?.contains(document.activeElement)) && (suggestions.length > 0);
  };

  const showSuggestions = async (query) => {
    if (query === '') {  // edge case with empty query (since everything matches with '')
      dispatch({ type: 'suggestions', data: [] });
    }
    else {
      let suggestions = await getSuggestions(query, historySrc);
      if (maxSuggestions >= 0) {
        suggestions = suggestions.slice(0, maxSuggestions);
      }
      dispatch({ type: 'suggestions', data: suggestions });
    }
  };

  const search = async (query) => {
    const searchInputDOM = document.querySelector('#searchInput');
    await searchQuery(searchURL, query);
    await updateHistory(query, historySrc);
    searchInputDOM.value = '';
    searchInputDOM.blur();
    showSuggestions('');
  };

  const onSearchElementKeyDown = (event, query) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search(query);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.target.blur();
    }
  };

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
              onKeyDown={(event) => onSearchElementKeyDown(event, event.target.value)}
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
