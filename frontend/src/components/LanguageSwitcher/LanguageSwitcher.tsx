import { Languages } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import type { Language } from '../../i18n/translations';

const languages: Language[] = ['en', 'pl'];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-line bg-wash px-1.5 py-1 text-xs text-ink-2"
      data-testid="language-switcher"
      aria-label={t('language.label')}
    >
      <Languages className="h-3.5 w-3.5 text-ink" />
      <div className="flex rounded-full bg-surface/50 p-0.5">
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
                isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
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
