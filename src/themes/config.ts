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
  { id: 'witcher3', name: '巫师 3：狂猎', description: '冷杉林绿与铁灰交织，旧纸底色中留一抹克制的血红。', previewColors: ['#263b33', '#edf0e9', '#faf9f3', '#8f453e', '#37434a'] },
  { id: 'reverse1999', name: '重返未来：1999', description: '蓝绿色与酒红相映，以旧金色点缀复古而清醒的阅读氛围。', previewColors: ['#294b50', '#e9efeb', '#faf8f1', '#80515c', '#b3935d'] },
]

export function resolveTheme(id: string | null | undefined): ThemeDefinition {
  return themes.find((theme) => theme.id === id) ?? themes[0]
}
