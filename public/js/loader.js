document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    let requestCount = 0;

    // Configure NProgress
    NProgress.configure({ showSpinner: false });

    const showLoader = () => {
        if (requestCount === 0) {
            loadingScreen.classList.add('visible');
            NProgress.start();
        }
        requestCount++;
    };

    const hideLoader = () => {
        requestCount--;
        if (requestCount <= 0) {
            requestCount = 0; // Reset to 0 to avoid negative counts
            NProgress.done();
            loadingScreen.classList.remove('visible');
        }
    };

    // Expose globally
    window.showLoader = showLoader;
    window.hideLoader = hideLoader;

    // Page navigation handling
    window.addEventListener('beforeunload', () => {
        showLoader();
    });

    // Use a timeout to hide the loader on load, allowing for resources to render
    window.addEventListener('load', () => {
        setTimeout(() => {
            hideLoader();
        }, 200); // Small delay to prevent flickering
    });

    // --- Example: Intercepting Fetch API ---
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        showLoader();
        try {
            const response = await originalFetch(...args);
            return response;
        } catch (error) {
            throw error;
        } finally {
            hideLoader();
        }
    };

    // --- Example: Intercepting Socket.IO ---
    // Assuming 'socket' is a globally available or passed-in instance
    // This is a conceptual example. You'll need to adapt it to your socket instance.
    if (window.io) {
        // This part is tricky because we don't know when the 'socket' variable is available.
        // A better approach is to wrap your socket event listeners manually.
        /*
        const socket = window.socket; // Assuming socket is global
        if (socket) {
            const originalEmit = socket.emit;
            socket.emit = function(...args) {
                const eventName = args[0];
                const ack = args[args.length - 1];

                // Only show loader for events that expect an acknowledgment (callback)
                if (typeof ack === 'function') {
                    showLoader();
                    args[args.length - 1] = function(...ackArgs) {
                        hideLoader();
                        return ack.apply(this, ackArgs);
                    };
                }
                return originalEmit.apply(this, args);
            };
        }
        */
    }
});
