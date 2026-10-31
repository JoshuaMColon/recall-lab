import { useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { navigate } from '../router'

type Variant = 'primary' | 'hl' | 'ghost' | 'danger' | 'plain'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-paper border-2 border-ink',
  hl: 'bg-hl text-on-hl border-2 border-ink',
  ghost: 'bg-card text-ink border-2 border-ink',
  danger: 'bg-card text-bad border-2 border-bad',
  plain: 'bg-transparent text-ink border-2 border-transparent !shadow-none hover:bg-sunk',
}

function spawnDot(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const dot = document.createElement('span')
  dot.className = 'tap-dot'
  dot.style.left = `${e.clientX - r.left}px`
  dot.style.top = `${e.clientY - r.top}px`
  el.appendChild(dot)
  dot.addEventListener('animationend', () => dot.remove())
}

/** A tooltip that shows on hover, keyboard focus and long-press, and describes its trigger. */
export function Tip({ tip, children, side = 'top', block = false }: { tip: string; children: (props: { 'aria-describedby': string }) => ReactNode; side?: 'top' | 'bottom'; block?: boolean }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  return (
    <span
      className={`relative ${block ? 'flex' : 'inline-flex'}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onTouchStart={() => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setOpen(true), 450)
      }}
      onTouchEnd={() => {
        window.clearTimeout(timer.current)
        window.setTimeout(() => setOpen(false), 900)
      }}
      onFocus={(e) => e.target.matches(':focus-visible') && setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      {children({ 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        className={`tooltip pointer-events-none absolute left-1/2 z-50 w-max max-w-60 rounded-md border-2 border-ink bg-ink px-2 py-1 text-center text-xs font-medium leading-snug text-paper ${
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } ${open ? '' : 'hidden'}`}
        style={{ transform: 'translateX(-50%)' }}
      >
        {tip}
      </span>
    </span>
  )
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tip: string
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  /** For icon-only buttons the tooltip text is also the accessible name. */
  iconOnly?: boolean
  side?: 'top' | 'bottom'
  block?: boolean
}

const SIZE = { sm: 'px-2.5 py-1 text-sm gap-1.5 rounded-lg', md: 'px-4 py-2 text-[0.95rem] gap-2 rounded-xl', lg: 'px-6 py-3 text-lg gap-2.5 rounded-xl' }

export function Btn({ tip, variant = 'ghost', size = 'md', iconOnly, side, block, className = '', children, onPointerDown, type = 'button', ...rest }: BtnProps) {
  return (
    <Tip tip={tip} side={side} block={block}>
      {(d) => (
        <button
          type={type}
          {...d}
          aria-label={iconOnly ? tip : rest['aria-label']}
          className={`press relative inline-flex select-none items-center justify-center overflow-hidden font-semibold ${SIZE[size]} ${VARIANT[variant]} ${block ? 'w-full' : ''} ${iconOnly ? '!px-2' : ''} ${className}`}
          onPointerDown={(e) => {
            if (!rest.disabled) spawnDot(e)
            onPointerDown?.(e)
          }}
          {...rest}
        >
          {children}
        </button>
      )}
    </Tip>
  )
}

/** A link that looks like a button (navigates within the app). */
export function LinkBtn({ to, tip, variant = 'ghost', size = 'md', className = '', children, block }: { to: string; tip: string; variant?: Variant; size?: 'sm' | 'md' | 'lg'; className?: string; children: ReactNode; block?: boolean }) {
  return (
    <Tip tip={tip} block={block}>
      {(d) => (
        <a
          href={to}
          {...d}
          className={`press relative inline-flex select-none items-center justify-center overflow-hidden font-semibold no-underline ${SIZE[size]} ${VARIANT[variant]} ${block ? 'w-full' : ''} ${className}`}
          onPointerDown={spawnDot}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
            e.preventDefault()
            navigate(to)
          }}
        >
          {children}
        </a>
      )}
    </Tip>
  )
}

export function Card({ children, className = '', as: As = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article'; 'aria-labelledby'?: string }) {
  return (
    <As className={`rounded-2xl border-2 border-ink bg-card p-5 shadow-ink ${className}`} {...rest}>
      {children}
    </As>
  )
}

export function Bar({ value, label, tone = 'teal' }: { value: number; label: string; tone?: 'teal' | 'hl' | 'coral' }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const fill = tone === 'hl' ? 'bg-hl' : tone === 'coral' ? 'bg-coral' : 'bg-teal'
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-sunk">
      <div className={`h-full ${fill} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function CodeBlock({ code, highlight, label = 'Python code' }: { code: string; highlight?: number; label?: string }) {
  const lines = code.split('\n')
  return (
    <pre aria-label={label} tabIndex={0} className="overflow-x-auto rounded-xl border-2 border-ink bg-code-bg py-3 text-[0.9rem] leading-relaxed text-code-ink">
      <code>
        {lines.map((l, i) => (
          <span key={i} className={`flex ${highlight === i + 1 ? 'bg-coral/30' : ''}`}>
            <span aria-hidden="true" className="w-10 shrink-0 select-none pr-3 text-right opacity-55">
              {i + 1}
            </span>
            <span className="whitespace-pre pr-4">{l || ' '}</span>
          </span>
        ))}
      </code>
    </pre>
  )
}

/** Plain textarea code editor: line numbers, Tab indents (Esc then Tab leaves), Enter keeps indentation. */
export function CodeEditor({ value, onChange, label, disabled }: { value: string; onChange: (v: string) => void; label: string; disabled?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const gutter = useRef<HTMLDivElement>(null)
  const escaped = useRef(false)
  const lines = value.split('\n').length
  const helpId = useId()

  function edit(e: KeyboardEvent<HTMLTextAreaElement>) {
    const t = e.currentTarget
    const { selectionStart: s, selectionEnd: end } = t
    if (e.key === 'Escape') {
      escaped.current = true
      return
    }
    if (e.key === 'Tab' && !escaped.current) {
      e.preventDefault()
      const before = value.slice(0, s)
      if (e.shiftKey) {
        const ls = before.lastIndexOf('\n') + 1
        const strip = value.slice(ls, ls + 4).match(/^ {1,4}/)?.[0].length ?? 0
        if (!strip) return
        onChange(value.slice(0, ls) + value.slice(ls + strip))
        requestAnimationFrame(() => t.setSelectionRange(Math.max(ls, s - strip), Math.max(ls, end - strip)))
        return
      }
      onChange(before + '    ' + value.slice(end))
      requestAnimationFrame(() => t.setSelectionRange(s + 4, s + 4))
      return
    }
    escaped.current = false
    if (e.key === 'Enter') {
      e.preventDefault()
      const ls = value.lastIndexOf('\n', s - 1) + 1
      const line = value.slice(ls, s)
      let indent = line.match(/^ */)?.[0] ?? ''
      if (/:\s*$/.test(line)) indent += '    '
      onChange(value.slice(0, s) + '\n' + indent + value.slice(end))
      requestAnimationFrame(() => t.setSelectionRange(s + 1 + indent.length, s + 1 + indent.length))
    }
  }

  return (
    <div>
      <div className="flex max-h-[26rem] overflow-hidden rounded-xl border-2 border-ink bg-code-bg text-code-ink focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-teal">
        <div ref={gutter} aria-hidden="true" className="w-10 shrink-0 select-none overflow-hidden py-3 pr-2 text-right font-mono text-[0.9rem] leading-relaxed opacity-55">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={ref}
          aria-label={label}
          aria-describedby={helpId}
          className="code min-h-48 w-full resize-y bg-transparent py-3 pr-3 text-[0.9rem] leading-relaxed text-code-ink outline-none"
          style={{ tabSize: 4 }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          rows={Math.min(18, Math.max(8, lines + 1))}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={edit}
          onScroll={(e) => {
            if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop
          }}
        />
      </div>
      <p id={helpId} className="mt-1 text-xs text-muted">
        Tab indents 4 spaces. Press Esc, then Tab, to move focus out of the editor.
      </p>
    </div>
  )
}

export function Pill({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'hl' | 'teal' | 'good' | 'bad' }) {
  const t = {
    plain: 'bg-sunk text-ink border-line',
    hl: 'bg-hl text-on-hl border-ink',
    teal: 'bg-card text-teal border-teal',
    good: 'bg-good-bg text-good border-good',
    bad: 'bg-bad-bg text-bad border-bad',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-xs font-semibold ${t}`}>{children}</span>
}
