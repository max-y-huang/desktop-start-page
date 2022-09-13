import { run } from 'uebersicht';
import { assertFile } from "./funcs";

export const searchQuery = async (searchURL, query) => {
  await run(`open "${searchURL.replace('<QUERY>', encodeURIComponent(query))}"`);
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
  if (items === '') {
    return [];
  }
  return items.trim().split('\n').map((item) => decodeURIComponent(item));
}

// const getAutoCompleteSuggestions = (query) => {
//   fetch(`api.datamuse.com/sug?s=${}`)
// }

export const getSuggestions = async (query, file) => {
  let suggestions = await getHistorySuggestions(query, file);
  return suggestions;
};
