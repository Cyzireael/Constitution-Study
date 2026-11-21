import { useEffect, useRef } from 'react'
import { BookMarked, ChevronDown, ChevronRight, Circle, GraduationCap } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { navigation } from '../app/navigation'
import { appConfig } from '../config/app'
import { useSubject } from '../core/SubjectContext'
import { ThemePicker } from './ThemePicker'

export function AppLayout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const initialRender = useRef(true)
  const { subject, subjects, setSubject } = useSubject()
  const currentPage = navigation.find((item) => item.path === location.pathname)

  useEffect(() => {
    document.title = `${currentPage?.label ?? '页面未找到'} · ${subject.name} · ${appConfig.displayName}`
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (!initialRender.current) mainRef.current?.focus()
    initialRender.current = false
  }, [currentPage, location.pathname, subject])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳转到主要内容</a>
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label={`${appConfig.displayName}，返回学习主页`}>
          <span className="brand-mark"><BookMarked size={25} strokeWidth={1.5} /></span>
          <span><strong>{appConfig.displayName}</strong><small>PERSONAL LAW STUDY</small></span>
        </Link>
        <label className="subject-picker">
          <span>当前学科</span>
          <span className="subject-picker-control"><select value={subject.subjectId} onChange={(event) => setSubject(event.target.value)} aria-label="切换学习学科">
            {subjects.map((item) => <option key={item.subjectId} value={item.subjectId}>{item.enabled ? item.name : `${item.name}（待添加）`}</option>)}
          </select><ChevronDown size={15} aria-hidden="true" /></span>
          <small className={`subject-state${subject.enabled ? ' enabled' : ''}`}>{subject.enabled ? '当前学科' : '课程待添加'}</small>
        </label>
        <div className="nav-label">我的学习空间</div>
        <nav className="primary-nav" aria-label="主导航">
          {navigation.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={19} strokeWidth={1.6} /><span>{label}</span><ChevronRight className="nav-chevron" size={14} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><GraduationCap size={21} strokeWidth={1.5} /><span>从课程出发<br /><strong>让知识有迹可循</strong></span></div>
          <div className="personal-label"><span className="avatar">我</span><span>个人复习空间<small>专注于你的学习节奏</small></span></div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>我的学习空间</span><ChevronRight size={14} /><strong>{currentPage?.label ?? '页面未找到'}</strong></div>
          <div className="topbar-actions"><span className="local-badge"><Circle size={6} fill="currentColor" />{subject.name}</span><ThemePicker /></div>
        </header>
        <main id="main-content" ref={mainRef} tabIndex={-1} className="main-content"><Outlet /></main>
        <footer className="site-footer"><span>{appConfig.displayName} · {subject.name}学习空间</span><span>依据课程资料，保持审慎求知。</span></footer>
      </div>
    </div>
  )
}
