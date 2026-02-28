type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

export function trackEvent(name: string, props?: EventProps) {
  if (typeof window !== "undefined" && window._paq) {
    window._paq.push(['trackEvent', 'UI', name, props ? JSON.stringify(props) : undefined]);
  }
}
