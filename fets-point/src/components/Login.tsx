import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, config } from '../lib/supabase'
import { Shield, MapPin } from 'lucide-react'
import { getAvailableBranches, formatBranchName } from '../utils/authUtils'

export function Login() {
  const [email, setEmail] = useState('mithun@fets.in') // Pre-fill test credentials
  const [password, setPassword] = useState('123456')
  const [selectedBranch, setSelectedBranch] = useState<string>('calicut')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const [mode, setMode] = useState<'login' | 'forgot_password'>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Get available branches based on email (for UI preview)
  const availableBranches = getAvailableBranches(email, null)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return

    setLoading(true)
    setResetMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      setResetMessage({
        type: 'success',
        text: 'Password reset link sent! Check your email.'
      })
    } catch (err: any) {
      setResetMessage({
        type: 'error',
        text: err.message || 'Failed to send reset link'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (import.meta.env.DEV) {
        console.log('Login attempt for:', email)
        console.log('Supabase config:', config)
      }

      // Test connection first if in development
      if (import.meta.env.DEV) {
        const { error: testError } = await supabase.from('staff_profiles').select('count', { count: 'exact', head: true })
        if (testError) {
          console.error('Connection test failed:', testError)
          setError(`Connection failed: ${testError.message}`)
          setLoading(false)
          return
        }
        console.log('Connection test passed, proceeding with login')
      }

      const { error } = await signIn(email, password)
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Login failed:', error)
        }
        setError(`Login failed: ${error.message}`)
      } else {
        // After successful login, update user's selected branch
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { error: updateError } = await supabase
            .from('staff_profiles')
            .update({ branch_assigned: selectedBranch })
            .eq('user_id', user.id)

          if (updateError) {
            console.error('❌ Error updating branch:', updateError.message)
          } else {
            console.log(`✅ Branch set to: ${selectedBranch}`)
          }
        }

        if (import.meta.env.DEV) {
          console.log('Login successful!')
        }
      }
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Login exception:', err)
      }
      setError(`Exception: ${err.message || 'Login failed'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Design Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Large Prominent Logo */}
        <div className="text-center mb-12">
          <div className="inline-block p-6 rounded-3xl bg-white/80 backdrop-blur-md shadow-2xl border border-white/30 mb-8">
            <img
              src="/fets-live-golden-logo.jpg"
              alt="FETS.LIVE"
              className="h-32 w-32 object-contain mx-auto"
            />
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-4 tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            FETS.LIVE
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"></div>
        </div>

        {/* 3D Login Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl">
          {/* Development Debug Panel */}
          {import.meta.env.DEV && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs">
              <div className="font-medium mb-1 text-yellow-800">Development Mode</div>
              <div className="text-yellow-700">
                <div>URL: {config.url}</div>
                <div>Key: {config.keyPreview}</div>
                <div className="text-green-600 mt-1">Environment variables: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Fallback'}</div>
              </div>
            </div>
          )}

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="font-medium text-sm text-red-800">Error:</div>
                  <div className="text-xs mt-1 text-red-700">{error}</div>
                </div>
              )}

              {/* 3D Email Input */}
              <div className="space-y-2">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl focus:ring-4 focus:ring-yellow-300/50 focus:border-yellow-400 transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium shadow-inner text-lg"
                  placeholder="Enter your email"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)'
                  }}
                  required
                />
              </div>

              {/* 3D Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl focus:ring-4 focus:ring-yellow-300/50 focus:border-yellow-400 transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium shadow-inner text-lg"
                    placeholder="Enter your password"
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)'
                    }}
                    required
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setMode('forgot_password')}
                    className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Branch Selector */}
              <div className="space-y-2">
                <label htmlFor="branch" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-amber-500" />
                  Select Your Branch
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableBranches.map((branch) => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => setSelectedBranch(branch)}
                      className={`
                        px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform
                        ${selectedBranch === branch
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg scale-105 border-2 border-yellow-500'
                          : 'bg-white border-2 border-yellow-200 text-gray-700 hover:border-yellow-400 hover:shadow-md'
                        }
                      `}
                      style={{
                        boxShadow: selectedBranch === branch
                          ? '0 4px 12px rgba(251, 191, 36, 0.4)'
                          : '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {formatBranchName(branch)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Premium GO LIVE Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 text-white font-black text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:transform-none shadow-lg"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>CONNECTING...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Shield className="h-6 w-6" />
                    <span className="tracking-widest">GO LIVE</span>
                  </div>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h3>
                <p className="text-sm text-gray-500">Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              {resetMessage && (
                <div className={`border rounded-xl p-4 ${resetMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                  <div className="text-sm">{resetMessage.text}</div>
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl focus:ring-4 focus:ring-yellow-300/50 focus:border-yellow-400 transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium shadow-inner text-lg"
                  placeholder="Enter your registered email"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 text-white font-black text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:transform-none shadow-lg"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>SENDING LINK...</span>
                  </div>
                ) : (
                  <span>SEND RESET LINK</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-3 text-amber-600 font-bold hover:text-amber-800 transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          {import.meta.env.DEV && (
            <div className="mt-6 text-center text-xs text-gray-500">
              Test Credentials: mithun@fets.in / 123456
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}