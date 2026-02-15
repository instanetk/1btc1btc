type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProps }) => void;
  }
}

export function trackEvent(name: string, props?: EventProps) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(name, props ? { props } : undefined);
  }
}
