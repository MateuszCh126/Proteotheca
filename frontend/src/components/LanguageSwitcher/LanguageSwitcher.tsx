import { Languages } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import type { Language } from '../../i18n/translations';

const languages: Language[] = ['en', 'pl'];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-1 text-xs text-slate-300"
      data-testid="language-switcher"
      aria-label={t('language.label')}
    >
      <Languages className="h-3.5 w-3.5 text-cyan-300" />
      <div className="flex rounded-full bg-slate-950/50 p-0.5">
        {languages.map((item) => {
          const isActive = language === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setLanguage(item)}
              aria-pressed={isActive}
              title={item === 'en' ? t('language.english') : t('language.polish')}
              className={`rounded-full px-2 py-0.5 font-bold uppercase transition-colors ${
                isActive ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
