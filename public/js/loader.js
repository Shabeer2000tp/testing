document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    let requestCount = 0;

    // --- Global Loader Functions ---
    window.showLoader = () => {
        requestCount++;
        if (loadingScreen && !loadingScreen.classList.contains('visible')) {
            loadingScreen.classList.add('visible');
            // Optional: Start NProgress
            if (window.NProgress) {
                NProgress.start();
            }
        }
    };

    window.hideLoader = () => {
        requestCount--;
        if (requestCount <= 0) {
            requestCount = 0; // Reset to 0
            if (loadingScreen && loadingScreen.classList.contains('visible')) {
                loadingScreen.classList.remove('visible');
                // Optional: End NProgress
                if (window.NProgress) {
                    NProgress.done();
                }
            }
        }
    };

    // --- Page Navigation Handling ---
    window.addEventListener('beforeunload', () => {
        showLoader();
    });

		// We need to hide the loader on pageshow in case the user navigates back
		window.addEventListener('pageshow', (event) => {
        // The 'persisted' property is true if the page is from the cache
        if (event.persisted) {
            hideLoader();
        }
    });


    // Hide loader once the page is fully loaded
    window.addEventListener('load', () => {
        hideLoader();
    });


    // --- Fetch API Interceptor (Example) ---
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

    // --- Socket.IO Interceptor (Example) ---
    // This requires you to slightly modify how you use socket.io
    // Wrap your socket event listeners with this
    window.withLoader = (socketEvent) => {
        return async (...args) => {
            showLoader();
            try {
                await socketEvent(...args);
            } finally {
                hideLoader();
            }
        };
    };
});