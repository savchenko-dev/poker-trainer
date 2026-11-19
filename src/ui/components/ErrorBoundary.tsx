import { Component, type ContextType, type ReactNode } from 'react';
import { LanguageContext } from '../../i18n/LanguageContext';
import { SESSION_STORAGE_KEY } from '../../state/storage';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  static contextType = LanguageContext;
  declare context: ContextType<typeof LanguageContext>;
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { t } = this.context;
    return (
      <main id="main" className="page">
        <h1>{t.error.title}</h1>
        <div className="bottom-bar">
          <a href="/" className="button-primary" onClick={() => sessionStorage.removeItem(SESSION_STORAGE_KEY)}>
            {t.backHome}
          </a>
        </div>
      </main>
    );
  }
}
