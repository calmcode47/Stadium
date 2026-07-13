import React, { useState } from 'react'
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check.mjs'
import { useOperations } from '@/hooks/useOperations'
import Panel from '@/components/design-system/Panel'
import Button from '@/components/design-system/Button'
import DataLabel from '@/components/design-system/DataLabel'

const demoLogins = [
  'admin@stadium.local',
  'operator@stadium.local',
  'viewer@stadium.local'
]

export const LoginScreen: React.FC = () => {
  const { login, authError, error } = useOperations()
  const [email, setEmail] = useState('operator@stadium.local')
  const [password, setPassword] = useState('Stadium123!')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await login(email, password)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-control-room text-primary flex items-center justify-center p-4">
      <Panel className="w-full max-w-md flex flex-col gap-5">
        <div className="flex items-center gap-3 border-b border-cyan/15 pb-4">
          <div className="p-2 border border-cyan/30 bg-cyan/10 rounded-[2px]">
            <ShieldCheck size={18} className="text-cyan" />
          </div>
          <div>
            <h1 className="font-display text-xl uppercase tracking-wider text-text-primary">Operations Login</h1>
            <DataLabel className="text-cyan">Smart Stadium Backend Session</DataLabel>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 font-mono text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-text-muted uppercase tracking-wider">Email</span>
            <input
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="bg-elevated border border-cyan/25 text-text-primary px-3 py-2 rounded-[2px] outline-none focus:border-cyan"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-text-muted uppercase tracking-wider">Password</span>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="bg-elevated border border-cyan/25 text-text-primary px-3 py-2 rounded-[2px] outline-none focus:border-cyan"
            />
          </label>
          {(authError || error) && (
            <div className="border border-danger/30 bg-danger/10 text-danger px-3 py-2 rounded-[2px] text-[10px] uppercase">
              {authError || error}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
          </Button>
        </form>

        <div className="border-t border-cyan/10 pt-3 text-[10px] font-mono text-text-muted">
          <div className="uppercase tracking-wider text-cyan mb-1">Demo accounts</div>
          {demoLogins.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setEmail(item)}
              className="block hover:text-cyan transition-colors"
            >
              {item} / Stadium123!
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}

export default LoginScreen
