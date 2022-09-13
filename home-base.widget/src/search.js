import { run } from 'uebersicht';
import { assertFile } from "./funcs";

export const searchQuery = (searchURL, query) => {
  run(`open "${searchURL.replace('<QUERY>', encodeURIComponent(query))}"`);
}

export const updateHistory = (query, file) => {
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

export const getSuggestions = async (query, file) => {
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
