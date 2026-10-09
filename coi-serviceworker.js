/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener('fetch', (event) => {
        if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
            return;
        }

        const request = (coepCredentialless && event.request.mode === 'no-cors')
            ? new Request(event.request, { credentials: 'omit' })
            : event.request;

        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set('Cross-Origin-Embedder-Policy', coepCredentialless ? 'credentialless' : 'require-corp');
                    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });
} else {
    (() => {
        const reloadedByCOI = window.sessionStorage.getItem('coiReloadedBySelf');
        if (reloadedByCOI) {
            window.sessionStorage.removeItem('coiReloadedBySelf');
        }

        const coepDegraded = (
            window.crossOriginIsolated === false &&
            window.isSecureContext &&
            navigator.serviceWorker
        );

        if (coepDegraded) {
            navigator.serviceWorker.register('./coi-serviceworker.js').then(
                (registration) => {
                    registration.addEventListener('updatefound', () => {
                        window.location.reload();
                    });

                    if (registration.active && !navigator.serviceWorker.controller) {
                        window.sessionStorage.setItem('coiReloadedBySelf', 'true');
                        window.location.reload();
                    }
                },
                (err) => {
                    // Silent failover if sandbox blocks registration
                }
            );
        }
    })();
}
