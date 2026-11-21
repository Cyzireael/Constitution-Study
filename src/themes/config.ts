export interface ThemeDefinition {
  id: string
  name: string
  description: string
  previewColors: readonly string[]
}

export const DEFAULT_THEME_ID = 'default'
export const THEME_STORAGE_KEY = 'law-study-platform.appearance.theme.v1'

export const themes: readonly ThemeDefinition[] = [
  { id: 'default', name: 'Default · 默认', description: '保留熟悉的藏蓝、纸白与柔和学术气息。', previewColors: ['#172e3c', '#edf1ef', '#ffffff', '#cdb58b', '#263a45'] },
  { id: 'aromantic', name: 'Aromantic · 无浪漫倾向', description: '深绿与浅绿，搭配白、灰和黑，安静而清晰。', previewColors: ['#3da542', '#a7d379', '#ffffff', '#a9a9a9', '#000000'] },
  { id: 'cyberpunk', name: 'Cyberpunk 2077 · 赛博朋克', description: '深色都市底色，点缀霓虹黄、青色与洋红。', previewColors: ['#080b10', '#171d25', '#fcee09', '#50e8ef', '#ff76c8'] },
]

export function resolveTheme(id: string | null | undefined): ThemeDefinition {
  return themes.find((theme) => theme.id === id) ?? themes[0]
}
