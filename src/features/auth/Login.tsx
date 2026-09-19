import { useState, type CSSProperties } from 'react'
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowLeft,
} from 'lucide-react'

import { apiClient } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'


export default function Login({
  onBack,
  onNavigateSignup,
  onSuccess,
  isEmbedded = false,
  dark = true,
}: {
  onBack?: () => void
  onNavigateSignup: () => void
  onSuccess: () => void
  isEmbedded?: boolean
  dark?: boolean
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()

  const itemStyle = (delay: number): CSSProperties => ({
    '--delay': `${delay}ms`,
  } as CSSProperties)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }

    setLoading(true)

    try {
      const response = await apiClient<any>('api/auth/login', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const token =
        response.token ||
        response.accessToken ||
        (typeof response === 'string' ? response : null)

      if (token) {
        const returnedUser = response.user || response.data?.user || {}

        // 1. Decode JWT Token payload signed securely by backend to extract role claim
        let tokenRole: string | null = null
        try {
          const payloadBase64 = token.split('.')[1]
          if (payloadBase64) {
            const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
            const payload = JSON.parse(decodedJson)
            const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['role'] || payload['roles']
            if (Array.isArray(roleClaim)) {
              tokenRole = roleClaim[0]
            } else if (typeof roleClaim === 'string') {
              tokenRole = roleClaim
            }
          }
        } catch {
          tokenRole = null
        }

        const normalizedEmail = email.trim().toLowerCase()
        const isExactAdminEmail = normalizedEmail === 'abouridaadminzad@zad.ai'

        const rawRole = returnedUser.role || tokenRole || (isExactAdminEmail ? 'admin' : 'user')
        const role = String(rawRole).toLowerCase()

        login(token, {
          id: returnedUser.id || '1',
          email: email.trim(),
          name: returnedUser.name || (role === 'admin' ? 'أدمن زاد' : 'مستخدم زاد'),
          role,
        })

        onSuccess()
      } else {
        throw new Error('لم يتم استلام رمز المصادقة من الخادم')
      }
    } catch (err: any) {
      setError(
        err.message === 'Invalid email or password.'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : err.message || 'فشل تسجيل الدخول، تحقق من بياناتك'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full auth-inner">

      {/* ───────────────── Error ───────────────── */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center mb-5">
          {error}
        </div>
      )}


      <form
        onSubmit={handleLogin}
        className="space-y-4"
      >

        {/* ───────────────── Email ───────────────── */}

        <div
          className="auth-item"
          style={itemStyle(140)}
        >
          <label className={`block text-[12px] font-medium mb-1.5 text-right transition-colors duration-1000 ${dark ? 'text-white/60' : 'text-slate-700'}`}>
            البريد الإلكتروني
          </label>

          <div className="relative group">

            <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors duration-300 ${dark ? 'text-white/40 group-focus-within:text-[#c084fc]' : 'text-slate-400 group-hover:text-primary/70 group-focus-within:text-primary'}`}>
              <Mail
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              style={{
                textAlign: 'left',
              }}
              className={`
                w-full
                border
                rounded-xl
                h-[50px]
                pl-12
                pr-4
                focus:outline-none
                transition-all
                duration-300
                text-[13px]
                ${dark
                  ? 'bg-white/[0.05] border-white/10 text-white hover:border-white/30 hover:bg-white/[0.08] focus:border-[#c084fc]/60 focus:bg-white/[0.07] focus:shadow-[0_0_15px_rgba(192,132,252,0.15)] placeholder:text-white/30'
                  : 'bg-black/[0.03] border-black/10 text-brand-deep hover:border-primary/40 hover:bg-black/[0.05] focus:border-primary/60 focus:bg-white focus:shadow-[0_4px_20px_rgba(122,23,201,0.1)] placeholder:text-slate-400'
                }
              `}
            />

          </div>
        </div>


        {/* ───────────────── Password ───────────────── */}

        <div
          className="auth-item"
          style={itemStyle(210)}
        >
          <label className={`block text-[12px] font-medium mb-1.5 text-right transition-colors duration-1000 ${dark ? 'text-white/60' : 'text-slate-700'}`}>
            كلمة المرور
          </label>

          <div className="relative group">

            <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors duration-300 ${dark ? 'text-white/40 group-focus-within:text-[#c084fc]' : 'text-slate-400 group-hover:text-primary/70 group-focus-within:text-primary'}`}>
              <Lock
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className={`
                absolute
                inset-y-0
                right-4
                flex
                items-center
                transition-colors
                focus:outline-none
                ${dark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-primary'}
              `}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff
                  size={18}
                  strokeWidth={1.8}
                />
              ) : (
                <Eye
                  size={18}
                  strokeWidth={1.8}
                />
              )}
            </button>

            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••••"
              dir="ltr"
              style={{
                textAlign: 'left',
              }}
              className={`
                w-full
                border
                rounded-xl
                h-[50px]
                pl-12
                pr-12
                focus:outline-none
                transition-all
                duration-300
                text-[14px]
                tracking-widest
                ${dark
                  ? 'bg-white/[0.05] border-white/10 text-white hover:border-white/30 hover:bg-white/[0.08] focus:border-[#c084fc]/60 focus:bg-white/[0.07] focus:shadow-[0_0_15px_rgba(192,132,252,0.15)] placeholder:text-white/30'
                  : 'bg-black/[0.03] border-black/10 text-brand-deep hover:border-primary/40 hover:bg-black/[0.05] focus:border-primary/60 focus:bg-white focus:shadow-[0_4px_20px_rgba(122,23,201,0.1)] placeholder:text-slate-400'
                }
              `}
            />

          </div>
        </div>


        {/* ───────────────── Remember + Forgot ───────────────── */}

        <div
          className="auth-item flex items-center justify-between pt-1"
          style={itemStyle(280)}
        >

          {/* Remember me */}

          <label className="flex items-center gap-2 cursor-pointer group">

            <div className="relative flex items-center justify-center">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
                className="peer sr-only"
              />

              <div
                className={`
                  w-[18px]
                  h-[18px]
                  border
                  rounded-[5px]
                  transition-all
                  ${dark
                    ? 'border-white/20 bg-white/5 hover:border-white/40 peer-checked:bg-[#9333ea] peer-checked:border-[#9333ea]'
                    : 'border-black/15 bg-black/[0.03] hover:border-primary/40 peer-checked:bg-primary peer-checked:border-primary'
                  }
                `}
              />

              <svg
                className="
                  absolute
                  w-3
                  h-3
                  text-white
                  pointer-events-none
                  opacity-0
                  peer-checked:opacity-100
                  transition-opacity
                "
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>

            </div>

            <span
              className={`
                text-[12px]
                select-none
                transition-colors
                ${dark ? 'text-white/50 group-hover:text-white/80' : 'text-slate-600 group-hover:text-primary'}
              `}
            >
              تذكرني
            </span>

          </label>


          {/* Forgot password */}

          <button
            type="button"
            className={`
              text-[12px]
              font-semibold
              transition-colors
              ${dark ? 'text-[#c084fc] hover:text-white' : 'text-primary hover:text-primary/70'}
            `}
          >
            نسيت كلمة المرور؟
          </button>

        </div>


        {/* ───────────────── Submit ───────────────── */}

        <button
          type="submit"
          disabled={loading}
          className="
            auth-item
            w-full
            brand-gradient
            text-white
            rounded-xl
            h-[50px]
            font-bold
            text-[14px]
            shadow-xl shadow-primary/30
            transition-all
            disabled:opacity-60
            flex
            items-center
            justify-center
            gap-3
            mt-2
            hover:-translate-y-0.5
            active:scale-[0.98]
          "
          style={itemStyle(350)}
        >

          {loading ? (
            <Loader2
              className="animate-spin"
              size={20}
            />
          ) : (
            <>
              <span>
                تسجيل الدخول
              </span>

              <ArrowLeft
                size={16}
                strokeWidth={2.5}
              />
            </>
          )}

        </button>


        {/* ───────────────── Google (Temporarily Disabled) ───────────────── */}


        {/* ───────────────── Signup Link ───────────────── */}

        <div
          className="auth-item text-center pt-1"
          style={itemStyle(510)}
        >

          <span className={`text-[13px] transition-colors duration-1000 ${dark ? 'text-white/40' : 'text-slate-600'}`}>
            ليس لديك حساب؟
          </span>

          {' '}

          <button
            type="button"
            onClick={onNavigateSignup}
            className={`
              text-[13px]
              font-semibold
              transition-colors
              ${dark ? 'text-[#c084fc] hover:text-white' : 'text-primary hover:text-primary/70'}
            `}
          >
            إنشاء حساب
          </button>

        </div>

      </form>

    </div>
  )
}
