import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

export default function UserMenu() {
  const { user, logout, loading } = useAuth();
  const { t } = useI18n();
  if (!user) return null;

  return (
    <div className="flex max-w-[14rem] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
      <UserCircle className="h-4 w-4 shrink-0 text-cyan-300" />
      <span className="hidden min-w-0 truncate sm:inline">{user.first_name || user.email}</span>
      <button
        type="button"
        onClick={() => void logout()}
        disabled={loading}
        className="rounded-full p-1 hover:bg-white/10 disabled:opacity-50"
        aria-label={t('auth.logOut')}
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
