import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { connect, type Host } from '@better/connector-sdk-web';
import { setCalendarLocale, notifyThemeChange } from '@better/connector-calendar';
import { App } from './App.js';
import { initI18n, setLocale } from './i18n.js';
import './styles/globals.css';
import '@better/connector-sdk-web/scrollbars.css';

async function bootstrap() {
  const host: Host = await connect();

  const initialLocale = await safe(() => host.i18n.locale(), 'en');
  await initI18n(initialLocale);
  setCalendarLocale(initialLocale);

  const initialTheme = await safe(
    () => host.theme.current(),
    { mode: 'light' as const, cssVars: {} as Record<string, string>, fontFamily: '' },
  );
  applyThemeMode(initialTheme.mode);

  host.theme.subscribe((snap) => {
    applyThemeMode(snap.mode);
  });
  host.i18n.subscribe((locale) => {
    setLocale(locale);
    setCalendarLocale(locale);
  });

  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <App host={host} />
    </StrictMode>,
  );
}

function applyThemeMode(mode: 'light' | 'dark'): void {
  const html = document.documentElement;
  if (mode === 'dark') html.classList.add('dark');
  else html.classList.remove('dark');
  // Notify the calendar package's theme listeners (color tint logic).
  notifyThemeChange();
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

bootstrap().catch((err) => {
  document.body.innerText = `connector failed to connect: ${err}`;
  // eslint-disable-next-line no-console
  console.error('[todo-ui] bootstrap failed', err);
});
