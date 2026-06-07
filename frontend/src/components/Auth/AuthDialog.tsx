import React, { useEffect, useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

interface AuthDialogProps {
  mode: 'login' | 'register';
  onClose: () => void;
}

export default function AuthDialog({ mode, onClose }: AuthDialogProps) {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const [activeMode, setActiveMode] = useState(mode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setActiveMode(mode);
    setError(null);
  }, [mode]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (activeMode === 'register') {
        await register({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), password });
      } else {
        await login({ email: email.trim(), password });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.authenticationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
      <form onSubmit={submit} className="glass-panel w-full max-w-md space-y-4 border border-cyan-400/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
            {activeMode === 'register' ? (
              <UserPlus className="h-4 w-4 shrink-0 text-cyan-300" />
            ) : (
              <LogIn className="h-4 w-4 shrink-0 text-cyan-300" />
            )}
            <span className="truncate">{activeMode === 'register' ? t('auth.createResearchAccount') : t('auth.signIn')}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10" aria-label={t('auth.closeDialog')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {activeMode === 'register' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="biomed-input"
              placeholder={t('auth.firstName')}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
            <input
              className="biomed-input"
              placeholder={t('auth.lastName')}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>
        )}

        <input
          className="biomed-input"
          type="email"
          placeholder={t('auth.email')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="biomed-input"
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={activeMode === 'register' ? 8 : 1}
        />

        {error && <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
        >
          {submitting ? t('common.working') : activeMode === 'register' ? t('auth.createAccount') : t('auth.signIn')}
        </button>

        <button
          type="button"
          className="text-xs text-slate-300 hover:text-cyan-300"
          onClick={() => {
            setError(null);
            setActiveMode(activeMode === 'register' ? 'login' : 'register');
          }}
        >
          {activeMode === 'register' ? t('auth.alreadyHaveAccount') : t('auth.needAccount')}
        </button>
      </form>
    </div>
  );
}
