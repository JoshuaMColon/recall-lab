import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'
import { stopSpeech } from './lib/speech'

// A handful of paths, so I did not pull in a router library. This is the
// one place that stops speech on a click. The set keeps every useLocation
// hook in step without a context.

const listeners = new Set<() => void>()

export function navigate(to: string, replace = false) {
  // Before the URL changes, so a lesson does not keep reading over the next page.
  stopSpeech()
  // replace is for redirects. Back should not return to the page that bounced them.
  if (replace) history.replaceState(null, '', to)
  else history.pushState(null, '', to)
  listeners.forEach((l) => l())
  window.scrollTo({ top: 0 })
}

export function useLocation() {
  const [loc, setLoc] = useState(() => ({ path: location.pathname, search: location.search }))
  useEffect(() => {
    const on = () => setLoc({ path: location.pathname, search: location.search })
    listeners.add(on)
    window.addEventListener('popstate', on)
    return () => {
      listeners.delete(on)
      window.removeEventListener('popstate', on)
    }
  }, [])
  return loc
}

export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return (
    <a
      href={to}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        // Modified clicks and non-primary buttons keep the browser's own behavior: a new tab, a download.
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    />
  )
}
