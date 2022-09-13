import { run } from 'uebersicht';
import { assertFile } from "./funcs";

const autoSuggestionsURL = 'https://api.datamuse.com/sug?s=<QUERY>';

export const searchQuery = async (query, searchURL) => {
  const url = searchURL.replace('<QUERY>', encodeURIComponent(query));
  await run(`open "${url}"`);
}

export const updateHistory = async (query, file) => {
  await assertFile(file);
  query = encodeURIComponent(query);
  // update history with move-to-front heuristic
  const oldHistory = await run(`cat "${file}"`);
  const filtered = oldHistory.trim().split('\n').filter((item) => item.toLowerCase() !== query.toLowerCase());
  const history = [query, ...filtered].join('\n');
  await run(`echo "${history}" > ${file}`);
};

const getHistorySuggestions = async (query, file) => {
  await assertFile(file);
  query = encodeURIComponent(query);
  const items = await run(`grep -F -i "${query}" "${file}"`);
  if (items === '') {  // edge case for ''
    return [];
  }
  return items.trim().split('\n').map((item) => decodeURIComponent(item));
}

const getAutoCompleteSuggestions = async (query) => {
  query = encodeURIComponent(query);
  const url = autoSuggestionsURL.replace('<QUERY>', query);
  const data = await (await fetch(url)).json();
  const suggestions = data.map((item) => item.word);
  return suggestions;
}

export const getSuggestions = async (query, file) => {
  const history = await getHistorySuggestions(query, file);
  const lowerCaseHistory = history.map((item) => item.toLowerCase());  // used to filter autoComplete
  const autoComplete = await getAutoCompleteSuggestions(query);
  const filteredAutoComplete = autoComplete.filter((item) => !lowerCaseHistory.includes(item.toLowerCase()));  // used to avoid duplicates with history
  return [
    ...history.map((suggestion) => ({ suggestion, fromHistory: true })),
    ...filteredAutoComplete.map((suggestion) => ({ suggestion, fromHistory: false }))
  ];
};
