export function shouldBypassCaptchaInDev() {
  return process.env.NODE_ENV === 'development';
}

export async function logPublication(flow, event, details = {}) {
  if (process.env.NODE_ENV !== 'development') return;

  try {
    await fetch('/api/debug/publication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flow,
        event,
        details,
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        host: typeof window !== 'undefined' ? window.location.host : '',
      }),
    });
  } catch (error) {
    console.warn('[publication-debug] No se pudo enviar log local', error);
  }
}
