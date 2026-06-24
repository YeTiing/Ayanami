import { useCallback, useMemo } from 'react'
import useSettingsStore from '@/stores/settingsStore'
import { locales } from './locales'

/**
 * Lightweight interpolation: replaces {key} placeholders with values from params.
 *
 *   interpolate('Hello {name}', { name: 'World' })  =>  'Hello World'
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key]
    return value !== undefined ? String(value) : _match
  })
}

/**
 * Core translation function (also exported for non-component usage).
 */
export function createT(
  localeMap: Record<string, string>,
  fallbackMap?: Record<string, string>,
) {
  return function t(key: string, params?: Record<string, string | number>): string {
    const value = localeMap[key]
    if (value !== undefined) return interpolate(value, params)
    // Fallback to en-US
    if (fallbackMap && fallbackMap[key] !== undefined) {
      return interpolate(fallbackMap[key], params)
    }
    // Show key as last resort
    return key
  }
}

/**
 * React Hook: useTranslation()
 *
 *   const { t, locale } = useTranslation()
 *   t('app.title')                  // "Ayanami"
 *   t('hello', { name: 'World' })   // "你好 World"
 */
export function useTranslation() {
  const locale = useSettingsStore((s) => s.locale)

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const current = locales[locale]
      const fallback = locale !== 'en-US' ? locales['en-US'] : undefined
      return createT(current, fallback)(key, params)
    },
    [locale],
  )

  return useMemo(() => ({ t, locale }), [t, locale])
}

export type { Locale } from '@/stores/settingsStore'
export { locales }
