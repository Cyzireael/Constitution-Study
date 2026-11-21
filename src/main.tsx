import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './app/App'
import { SubjectProvider } from './core/SubjectContext'
import { ThemeProvider } from './core/ThemeContext'
import { migrateLegacyStorage } from './core/migrateLegacyStorage'
import './styles/global.css'

if (typeof window !== 'undefined') migrateLegacyStorage()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider><SubjectProvider><App /></SubjectProvider></ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
)
