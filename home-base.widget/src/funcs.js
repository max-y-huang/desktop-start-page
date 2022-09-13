import { run, css } from 'uebersicht';
import stylesTemplate from '../styles.json';
import themes from '../themes.json';

export const objectMap = (obj, fn) => {
  return Object.fromEntries(Object.entries(obj).map(([key, val]) => [key, fn(val)]));
};

export const assertFile = async (src) => {
  await run(`if [ ! -f "${src}" ]; then touch ${src}; fi`);
};

export const makeStyles = (theme) => {
  const themeData = themes[theme];  // used in eval step
  const pattern = /<[^>]*>/;        // pattern to evaluate: <EXPRESSION>
  let s = JSON.stringify(stylesTemplate);
  while (s.match(pattern)) {
    const match = s.match(pattern)[0];
    s = s.replace(match, eval('themeData.' + match.slice(1, -1)));
  }
  return objectMap(JSON.parse(s), css);
}
