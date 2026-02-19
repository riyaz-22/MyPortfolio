/* ═══════════════════════════════════════════════════════════════
   CENTRALIZED LOADER STATE MANAGER (Public Portfolio)
   ═══════════════════════════════════════════════════════════════
   Manages loading states for the public portfolio renderer.
   Provides unified loading indicator for all API calls.
*/

const LoaderManager = (() => {
     let loaderElement = null;
     let loadingCount = 0;
     const LOADER_ID = 'global-loader';

     /**
      * Initialize the loader element (create if doesn't exist)
      */
     function initLoader() {
          if (loaderElement) return;

          // Check if loader already exists in DOM
          loaderElement = document.getElementById(LOADER_ID);
          if (loaderElement) return;

          // Create loader element
          loaderElement = document.createElement('div');
          loaderElement.id = LOADER_ID;
          loaderElement.className = 'global-loader hidden';
          loaderElement.innerHTML = `
               <div class="loader-overlay"></div>
               <div class="loader-container">
                    <div class="loader-spinner"></div>
                    <p class="loader-text">Loading...</p>
               </div>
          `;
          document.body.appendChild(loaderElement);
     }

     /**
      * Show the loading indicator
      */
     function show(text = 'Loading...') {
          initLoader();
          loaderElement.querySelector('.loader-text').textContent = text;
          loadingCount++;
          loaderElement.classList.remove('hidden');
          document.body.classList.add('loader-active');
          console.log(`[Loader] Show (count: ${loadingCount})`);
     }

     /**
      * Hide the loading indicator
      */
     function hide() {
          loadingCount = Math.max(0, loadingCount - 1);
          if (loadingCount === 0 && loaderElement) {
               loaderElement.classList.add('hidden');
               document.body.classList.remove('loader-active');
               console.log('[Loader] Hide');
          } else if (loadingCount > 0) {
               console.log(`[Loader] Decrement (count: ${loadingCount})`);
          }
     }

     /**
      * Reset the loader (clear all loading states)
      */
     function reset() {
          loadingCount = 0;
          if (loaderElement) {
               loaderElement.classList.add('hidden');
               document.body.classList.remove('loader-active');
          }
          console.log('[Loader] Reset');
     }

     /**
      * Check if currently loading
      */
     function isLoading() {
          return loadingCount > 0;
     }

     /**
      * Wrap an async operation with loading state
      * Usage: LoaderManager.wrap(asyncFn, 'Saving...').then(...).catch(...)
      */
     function wrap(asyncFn, loadingText = 'Loading...') {
          show(loadingText);
          return Promise.resolve()
               .then(() => asyncFn())
               .finally(() => hide());
     }

     /**
      * Quick show/hide for simple operations
      * Usage: LoaderManager.execute(async () => { ... }, 'Processing...')
      */
     async function execute(asyncFn, loadingText = 'Loading...') {
          show(loadingText);
          try {
               const result = await asyncFn();
               return result;
          } finally {
               hide();
          }
     }

     return {
          show,
          hide,
          reset,
          isLoading,
          wrap,
          execute,
          /**
           * Auto-wrap API calls
           * Usage: LoaderManager.withLoader(fetchFn, 'Fetching portfolio...')
           */
          withLoader(fetchFn, loadingText = 'Loading...') {
               return LoaderManager.wrap(() => fetchFn(), loadingText);
          },
     };
})();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
     module.exports = LoaderManager;
}
