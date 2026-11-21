import { useEffect, useId, useRef, useState } from 'react'
import { Check, Palette, X } from 'lucide-react'
import { useTheme } from '../core/ThemeContext'
import { themes } from '../themes/config'

export function ThemePicker() {
  const { theme, setTheme, storageError } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    containerRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus()
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false)
    }
    const dismissEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissEscape)
    }
  }, [open])

  return <div className="theme-picker" ref={containerRef} onBlur={(event) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <button ref={triggerRef} className="theme-trigger" type="button" aria-label="选择外观主题" aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog" onClick={() => setOpen((value) => !value)}>
      <Palette size={16} /><span>外观主题</span>
    </button>
    {open && <section id={panelId} className="theme-menu" role="dialog" aria-label="外观主题选择">
      <div className="theme-menu-heading"><div><h2>外观主题</h2><p>全站生效，与学习学科独立保存。</p></div><button className="icon-button" type="button" aria-label="关闭主题选择" onClick={() => { setOpen(false); triggerRef.current?.focus() }}><X size={15} /></button></div>
      <fieldset className="theme-options"><legend className="visually-hidden">选择外观主题</legend>
        {themes.map((item) => <label key={item.id} className="theme-option" data-selected={theme.id === item.id}>
          <input type="radio" name={panelId} value={item.id} checked={theme.id === item.id} onChange={() => setTheme(item.id)} />
          <span className="theme-option-copy"><span className="theme-option-title">{item.name}{theme.id === item.id && <span className="theme-current"><Check size={12} />当前</span>}</span><span className="theme-option-description">{item.description}</span><span className="theme-swatches" aria-hidden="true">{item.previewColors.map((color) => <span key={color} style={{ backgroundColor: color }} />)}</span></span>
        </label>)}
      </fieldset>
      {storageError && <p className="theme-storage-warning" role="status">{storageError}</p>}
    </section>}
  </div>
}
