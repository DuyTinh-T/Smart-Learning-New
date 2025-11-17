"use client"

import { useEffect } from 'react'

// Detect webpack/Next chunk load failures in the browser and attempt a full reload.
// This helps recover when the client has a stale asset manifest (common during dev hot-reloads
// or when the dev server restarted on a different port). We keep this small and opt-in.
export default function ChunkErrorHandler() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      try {
        const msg = event.message || ''
        // Typical messages: "Loading chunk X failed." or "ChunkLoadError: Loading chunk failed."
        if (msg.includes('Loading chunk') || msg.includes('chunk') && msg.includes('failed')) {
          // Avoid infinite loop: only attempt once per page load
          console.warn('Chunk load failure detected — reloading page to recover')
          // Small delay to let the browser settle
          setTimeout(() => window.location.reload(), 300)
        }
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener('error', onError)
    return () => window.removeEventListener('error', onError)
  }, [])

  return null
}
