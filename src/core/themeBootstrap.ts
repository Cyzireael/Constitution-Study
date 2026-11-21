import { DEFAULT_THEME_ID, THEME_STORAGE_KEY, themes } from '../themes/config.ts'

// Runs before styles paint, using the same registry and storage key as React.
export function buildThemeBootstrapScript() {
  return `(function(){var id=${JSON.stringify(DEFAULT_THEME_ID)};try{var saved=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(themes.map((theme) => theme.id))}.includes(saved))id=saved;}catch(e){}document.documentElement.dataset.theme=id;})();`
}
