import zhCN from './zh-CN'
import enUS from './en-US'
import type { Locale } from '@/stores/settingsStore'

const locales: Record<Locale, Record<string, string>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export { locales }
export default locales
