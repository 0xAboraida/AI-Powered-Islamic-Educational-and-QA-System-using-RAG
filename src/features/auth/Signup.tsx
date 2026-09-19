import { useState, type CSSProperties } from 'react'
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  ArrowLeft,
} from 'lucide-react'

import { apiClient } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'


export default function Signup({
  onBack,
  onNavigateLogin,
  onSuccess,
  isEmbedded = false,
  dark = true,
}: {
  onBack?: () => void
  onNavigateLogin: () => void
  onSuccess: () => void
  isEmbedded?: boolean
  dark?: boolean
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()

  const itemStyle = (delay: number): CSSProperties => ({
    '--delay': `${delay}ms`,
  } as CSSProperties)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تتكون من 8 أحرف على الأقل')
      return
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    setLoading(true)

    try {
      const response = await apiClient<any>(
        'api/auth/register',
        {
          method: 'POST',
          requireAuth: false,
          body: JSON.stringify({
            name,
            email,
            password,
            confirmPassword: password,
          }),
        }
      )

      const token =
        response.token ||
        response.accessToken ||
        (typeof response === 'string'
          ? response
          : null)

      if (token) {
        login(token, {
          id: '1',
          email,
          name,
        })

        onSuccess()
      } else {
        onNavigateLogin()
      }
    } catch (err: any) {
      setError(
        err.message ||
          'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full auth-inner">

      {/* ───────────────── Error ───────────────── */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs text-center mb-3">
          {error}
        </div>
      )}


      <form
        onSubmit={handleSignup}
        className="space-y-3.5"
      >

        {/* ───────────────── Name ───────────────── */}

        <div
          className="auth-item"
          style={itemStyle(140)}
        >

          <label className={`block text-[12px] font-medium mb-1.5 text-right transition-colors duration-1000 ${dark ? 'text-white/60' : 'text-slate-700'}`}>
            الاسم الكامل
          </label>

          <div className="relative group">

            <div className={`absolute inset-y-0 right-4 flex items-center pointer-events-none transition-colors duration-300 ${dark ? 'text-white/40 group-focus-within:text-[#c084fc]' : 'text-slate-400 group-hover:text-primary/70 group-focus-within:text-primary'}`}>
              <User
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="الاسم الكامل"
              className={`
                w-full
                border
                rounded-xl
                h-[50px]
                pr-12
                pl-4
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


        {/* ───────────────── Email ───────────────── */}

        <div
          className="auth-item"
          style={itemStyle(200)}
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
              onChange={(e) =>
                setEmail(e.target.value)
              }
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
          style={itemStyle(260)}
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
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
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


        {/* ───────────────── Confirm Password ───────────────── */}

        <div
          className="auth-item"
          style={itemStyle(320)}
        >

          <label className={`block text-[12px] font-medium mb-1.5 text-right transition-colors duration-1000 ${dark ? 'text-white/60' : 'text-slate-700'}`}>
            تأكيد كلمة المرور
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
                setShowConfirmPassword(
                  !showConfirmPassword
                )
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
              {showConfirmPassword ? (
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
              type={
                showConfirmPassword
                  ? 'text'
                  : 'password'
              }
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
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
            mt-1
            hover:-translate-y-0.5
            active:scale-[0.98]
          "
          style={itemStyle(380)}
        >

          {loading ? (
            <Loader2
              className="animate-spin"
              size={20}
            />
          ) : (
            <>
              <span>
                إنشاء الحساب
              </span>

              <ArrowLeft
                size={16}
                strokeWidth={2.5}
              />
            </>
          )}

        </button>


        {/* ───────────────── Google (Temporarily Disabled) ───────────────── */}


        {/* ───────────────── Login Link ───────────────── */}

        <div
          className="auth-item text-center pt-1"
          style={itemStyle(540)}
        >

          <span className={`text-[13px] transition-colors duration-1000 ${dark ? 'text-white/40' : 'text-slate-600'}`}>
            لديك حساب بالفعل؟
          </span>

          {' '}

          <button
            type="button"
            onClick={onNavigateLogin}
            className={`
              text-[13px]
              font-semibold
              transition-colors
              ${dark ? 'text-[#c084fc] hover:text-white' : 'text-primary hover:text-primary/70'}
            `}
          >
            تسجيل الدخول
          </button>

        </div>

      </form>

    </div>
  )
}
