import { createContext, useContext, useEffect, useState } from 'react'
import { t as translate } from '../i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lemon-lang') || 'zh')
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('lemon-font') || 'large')

  useEffect(() => {
    localStorage.setItem('lemon-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    localStorage.setItem('lemon-font', fontSize)
    document.documentElement.dataset.fontSize = fontSize
  }, [fontSize])

  const t = (key) => translate(lang, key)

  return (
    <LangContext.Provider value={{ lang, setLang, t, fontSize, setFontSize }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
