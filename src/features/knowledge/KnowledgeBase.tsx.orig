import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Library, Search, X, Folder, FolderOpen, Pen, ChevronDown } from 'lucide-react'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import darkLogo from '@/assets/images/ZadDarkLogo.png'
import { countBooks, domains, type Book, type Category, type Domain } from './data'
import { useTheme } from '../../contexts/ThemeContext'

const norm = (s: string) => s.trim().toLowerCase()
const PAGE_SIZE = 24
const STORE_KEY = 'zad-kb'

/** Highlights the matching part of a string with a soft accent mark. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = norm(text).indexOf(query)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-accent/20 px-0.5 text-primary">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

/** Minimal Islamic-library illustration (books under an arch), inline SVG. */
function LibraryArt() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" role="img" aria-label="مكتبة إسلامية">
      <defs>
        <linearGradient id="kb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ad46ff" />
          <stop offset="1" stopColor="#2b7fff" />
        </linearGradient>
      </defs>
      <path d="M40 180V96a80 80 0 0 1 160 0v84" fill="none" stroke="url(#kb-g)" strokeWidth="3" opacity="0.5" />
      <path d="M120 24l6 12 12 2-9 9 2 12-11-6-11 6 2-12-9-9 12-2z" fill="url(#kb-g)" opacity="0.9" />
      <g strokeWidth="2" stroke="url(#kb-g)" fill="none">
        <rect x="70" y="120" width="18" height="52" rx="3" />
        <rect x="92" y="110" width="18" height="62" rx="3" />
        <rect x="114" y="126" width="18" height="46" rx="3" />
        <rect x="136" y="114" width="18" height="58" rx="3" />
        <rect x="158" y="132" width="18" height="40" rx="3" />
      </g>
      <line x1="52" y1="180" x2="188" y2="180" stroke="url(#kb-g)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function BookCard({ book, query, onAsk }: { book: Book; query: string; onAsk: (b: Book) => void }) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-accent/40 hover:shadow-[0_16px_40px_-18px_rgba(122,23,201,0.5)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand-blue transition-colors group-hover:bg-primary group-hover:text-white">
          <BookOpen className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-display text-lg text-foreground">
            <Highlight text={book.title} query={query} />
          </h4>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <Pen className="h-3.5 w-3.5" /> <Highlight text={book.author} query={query} />
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] text-secondary-foreground">
          ✓ مصدر معتمد
        </span>
        <button
          type="button"
          onClick={() => onAsk(book)}
          className="rounded-full border border-accent/30 px-3 py-1 text-xs font-medium text-primary opacity-0 transition-all hover:bg-secondary group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          اسأل زاد عنه
        </button>
      </div>
    </div>
  )
}

function CategoryBlock({
  cat,
  open,
  onToggle,
  query,
  onAsk,
}: {
  cat: Category
  open: boolean
  onToggle: () => void
  query: string
  onAsk: (b: Book) => void
}) {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const shown = cat.books.slice(0, limit)
  const panelId = `cat-panel-${cat.id}`

  return (
    <div className="rounded-2xl border border-border/70 bg-background/40">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="group flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="text-accent" aria-hidden="true">
          {open ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
        </span>
        <span className="flex-1 font-medium text-foreground">
          <Highlight text={cat.name} query={query} />
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
          {cat.books.length}
        </span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition-all duration-300 group-hover:bg-secondary ${open ? 'rotate-180 bg-primary/15 text-primary group-hover:bg-primary/25' : ''}`} aria-hidden>
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <div id={panelId} className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="grid gap-4 px-4 pb-4 pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((b) => (
              <BookCard key={b.title} book={b} query={query} onAsk={onAsk} />
            ))}
          </div>
          {cat.books.length > limit && (
            <div className="px-4 pb-4 text-center">
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                className="rounded-full border border-border bg-card/60 px-5 py-2 text-sm text-primary transition-colors hover:bg-secondary"
              >
                تحميل المزيد ({cat.books.length - limit})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DomainAccordion({
  domain,
  open,
  onToggle,
  openCats,
  toggleCat,
  forceOpen,
  query,
  onAsk,
}: {
  domain: Domain
  open: boolean
  onToggle: () => void
  openCats: Set<string>
  toggleCat: (id: string) => void
  forceOpen: boolean
  query: string
  onAsk: (b: Book) => void
}) {
  const isOpen = forceOpen || open
  const bookCount = countBooks([domain])
  const panelId = `domain-panel-${domain.id}`

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-md shadow-[0_8px_30px_-18px_rgba(122,23,201,0.35)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="group flex w-full items-center gap-4 p-5 text-right transition-colors hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl text-white shadow-lg shadow-primary/25">
          {domain.icon}
        </span>
        <div className="flex-1">
          <h3 className="font-display text-2xl text-foreground">
            <Highlight text={domain.name} query={query} />
          </h3>
          <p className="text-sm text-muted-foreground">
            {domain.categories.length} تصنيفات · {bookCount} كتاب
          </p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition-all duration-300 group-hover:bg-secondary ${isOpen ? 'rotate-180 bg-accent/15 text-accent group-hover:bg-accent/25' : ''}`} aria-hidden>
          <ChevronDown className="h-5 w-5" />
        </span>
      </button>

      <div id={panelId} className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="space-y-4 px-5 pb-5 pt-2">
            {domain.categories.map((cat) => (
              <CategoryBlock
                key={cat.id}
                cat={cat}
                open={forceOpen || openCats.has(cat.id)}
                onToggle={() => toggleCat(cat.id)}
                query={query}
                onAsk={onAsk}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-3xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 rounded bg-secondary" />
              <div className="h-3 w-28 rounded bg-secondary/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function KnowledgeBase({
  onExit,
  onAskBook,
}: {
  onExit: () => void
  onAskBook: (book: Book) => void
}) {
  const { theme } = useTheme()
  // restore persisted state
  const persisted = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') as { query?: string; filter?: string }
    } catch {
      return {}
    }
  })()

  const [query, setQuery] = useState(persisted.query ?? '')
  const [filter, setFilter] = useState<string>(persisted.filter ?? 'all')
  const [loading, setLoading] = useState(true)
  const [openDomains, setOpenDomains] = useState<Set<string>>(new Set())
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  const q = norm(query)
  const searching = q.length > 0

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ query, filter }))
    } catch {
      /* ignore */
    }
  }, [query, filter])

  const visible = useMemo(() => {
    return domains
      .filter((d) => filter === 'all' || d.id === filter)
      .map((d) => {
        if (!q) return d
        const domainMatch = norm(d.name).includes(q)
        const categories = d.categories
          .map((c) => {
            const catMatch = domainMatch || norm(c.name).includes(q)
            const books = catMatch
              ? c.books
              : c.books.filter((b) => norm(b.title).includes(q) || norm(b.author).includes(q))
            return { ...c, books }
          })
          .filter((c) => c.books.length > 0 || domainMatch)
        return { ...d, categories }
      })
      .filter((d) => d.categories.length > 0)
  }, [q, filter])

  const resultBooks = countBooks(visible)
  const totalBooks = countBooks(domains)
  const isFiltered = searching || filter !== 'all'

  const toggleDomain = (id: string) =>
    setOpenDomains((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleCat = (id: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const expandAll = () => {
    setOpenDomains(new Set(visible.map((d) => d.id)))
    setOpenCats(new Set(visible.flatMap((d) => d.categories.map((c) => c.id))))
  }
  const collapseAll = () => {
    setOpenDomains(new Set())
    setOpenCats(new Set())
  }
  const clearAll = () => {
    setQuery('')
    setFilter('all')
  }

  const chips = [{ id: 'all', name: 'الكل' }, ...domains.map((d) => ({ id: d.id, name: d.name }))]

  return (
    <div dir="rtl" className={`relative min-h-screen bg-background text-foreground transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #7a17c9 1px, transparent 0), radial-gradient(circle at 20px 20px, #2b7fff 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="pointer-events-none fixed -right-32 top-0 h-96 w-96 rounded-full bg-brand-magenta/10 blur-[130px]" />
      <div className="pointer-events-none fixed -left-32 top-40 h-96 w-96 rounded-full bg-brand-blue/10 blur-[130px]" />

      <div className="absolute right-5 top-5 z-40">
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-border bg-background/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-md transition-colors hover:bg-secondary hover:text-foreground"
        >
          → العودة إلى الموقع
        </button>
      </div>

      <main className="relative mx-auto max-w-6xl px-5 pb-24">
        {/* Hero */}
        <section className="grid items-center gap-8 pt-20 pb-12 md:grid-cols-[1.4fr_1fr] md:py-16">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <h1 className="font-display text-5xl text-foreground md:text-7xl">
              <span className="brand-text-gradient drop-shadow-sm">المكتبة</span>
            </h1>
            
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              تضم المكتبة في Zad-AI مجموعة مختارة بعناية من أمهات الكتب في مختلف العلوم
              الشرعية، جرى تنظيمها وتصنيفها لتوفير تجربة بحث واسترجاع دقيقة وموثوقة.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/40 px-5 py-3 backdrop-blur-md transition-transform hover:scale-105">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl text-foreground">+{totalBooks}</p>
                  <p className="text-xs text-muted-foreground">كتاب ومجلد</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/40 px-5 py-3 backdrop-blur-md transition-transform hover:scale-105">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-magenta/20 text-brand-magenta">
                  <Library className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl text-foreground">{domains.length}</p>
                  <p className="text-xs text-muted-foreground">مجال علمي</p>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className="relative mx-auto flex w-full max-w-xs items-center justify-center p-6 animate-in fade-in zoom-in duration-1000 delay-300 fill-mode-both"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          >
            <div className="absolute inset-0 rounded-full bg-brand-magenta/20 blur-[80px]" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <img 
              src={theme === 'dark' ? whiteLogo : darkLogo} 
              alt="شعار مكتبة زاد" 
              className={`relative z-10 h-56 w-56 object-contain drop-shadow-2xl md:h-72 md:w-72 transition-transform duration-300 ${theme === 'light' ? 'scale-[1.4]' : ''}`} 
            />
            <style>{`
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
                100% { transform: translateY(0px); }
              }
            `}</style>
          </div>
        </section>

        {/* Search */}
        <div className="mb-2">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-5 py-3.5 shadow-sm backdrop-blur-md focus-within:border-accent/50">
            <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم الكتاب أو المؤلف أو المجال…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  filter === c.id
                    ? 'brand-gradient text-white shadow-md shadow-primary/25'
                    : 'border border-border bg-card/60 text-foreground/70 backdrop-blur-sm hover:border-accent/40'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: result count + controls */}
        {!loading && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {resultBooks > 0
                ? <>تم العثور على <span className="font-semibold text-foreground">{resultBooks}</span> كتابًا في <span className="font-semibold text-foreground">{visible.length}</span> مجالات</>
                : 'لا توجد نتائج'}
              {isFiltered && (
                <button type="button" onClick={clearAll} className="mr-3 text-primary underline-offset-4 hover:underline">
                  مسح الكل
                </button>
              )}
            </p>
            {!searching && visible.length > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={expandAll} className="rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-primary transition-colors hover:bg-secondary">
                  فتح الكل
                </button>
                <button type="button" onClick={collapseAll} className="rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary">
                  طيّ الكل
                </button>
              </div>
            )}
          </div>
        )}

        {/* Domains */}
        <section className="mt-4 space-y-4">
          {loading ? (
            <SkeletonList />
          ) : visible.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card/60 py-20 text-center backdrop-blur-md">
              <p className="text-lg text-muted-foreground">لا توجد نتائج مطابقة لبحثك.</p>
              {isFiltered && (
                <button type="button" onClick={clearAll} className="mt-3 rounded-full border border-border px-5 py-2 text-sm text-primary transition-colors hover:bg-secondary">
                  مسح الكل
                </button>
              )}
            </div>
          ) : (
            visible.map((d) => (
              <div key={d.id} className="animate-[fadeIn_0.4s_ease]">
                <DomainAccordion
                  domain={d}
                  open={openDomains.has(d.id)}
                  onToggle={() => toggleDomain(d.id)}
                  openCats={openCats}
                  toggleCat={toggleCat}
                  forceOpen={searching}
                  query={q}
                  onAsk={onAskBook}
                />
              </div>
            ))
          )}
        </section>
      </main>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}
