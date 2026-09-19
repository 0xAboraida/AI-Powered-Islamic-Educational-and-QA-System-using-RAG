import darkLogo from '@/assets/images/ZadDarkLogo.png'

type Props = { variant?: 'light' | 'dark' }

function Badge({ store, sub, variant, link }: { store: string; sub: string; variant: 'light' | 'dark', link: string }) {
  const isLight = variant === 'light'
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 rounded-2xl px-6 py-3 transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        isLight
          ? 'border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
          : 'border border-border bg-card text-card-foreground shadow-[0_4px_20px_rgba(122,23,201,0.08)] hover:shadow-[0_8px_30px_rgba(122,23,201,0.15)] hover:border-primary/30'
      }`}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-black shadow-inner"
      >
        <img src={darkLogo} alt="شعار تطبيق زاد" className="h-6 w-6 object-contain" />
      </span>
      <span className="flex flex-col text-right leading-tight">
        <span className={`text-[11px] ${isLight ? 'text-white/70' : 'text-muted-foreground'}`}>{sub}</span>
        <span className="text-[15px] font-bold">{store}</span>
      </span>
    </a>
  )
}

export default function StoreBadges({ variant = 'dark' }: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <Badge 
        store="APKPure" 
        sub="حمّل التطبيق" 
        variant={variant}
        link="https://86xf0kqg.r.ap-southeast-1.awstrack.me/L0/https:%2F%2Fapkpure.com%2Fp%2Fcom.example.zaad/1/010e019ff006a24e-825f8914-d3a2-4826-833c-f37eda270722-000000/bFg55P-E8VF2Y00GCGodw2HqOQo=258"
      />
    </div>
  )
}
