# iOS PWA Offline Layout & Asset Loading Fix

## Problem

The Super Productivity app was experiencing layout issues and asset loading problems when running as a Progressive Web App (PWA) on iOS, specifically when offline.

## Root Causes Identified

1. **Missing viewport-fit=cover**: iOS requires this for proper handling of safe areas (notch, home indicator)
2. **Missing iOS-specific PWA meta tags**: Required for proper PWA behavior on iOS
3. **Inadequate service worker caching**: Critical assets like fonts, icons, and themes weren't being prefetched
4. **No safe-area-inset support**: Layout wasn't accounting for iOS notch and home indicator areas
5. **HTML scrolling issues**: iOS PWA can exhibit rubber-band scrolling that breaks layout

## Fixes Applied

### 1. Updated index.html

- Added `viewport-fit=cover` to viewport meta tag
- Added iOS-specific PWA meta tags:
  - `apple-mobile-web-app-capable`: Enables full-screen mode
  - `apple-mobile-web-app-status-bar-style`: Controls status bar appearance
  - `apple-mobile-web-app-title`: Sets app title on home screen

### 2. Updated styles/page.scss

- Added safe-area-inset padding to html, body, app-root, and .app-frame
- Fixed body positioning to respect safe areas with fallbacks
- Added `position: fixed` to html element to prevent iOS rubber-band scrolling
- Updated body positioning to use env(safe-area-inset-\*) with 0 fallbacks

### 3. Updated ngsw-config.json

- Changed asset group caching strategy:
  - **app group**: Remains prefetch for core files (index.html, manifest.json, CSS, JS)
  - **assets group**: Changed to prefetch for fonts, icons, and themes (critical resources)
  - **lazy-assets group**: New group for non-critical assets with lazy loading
- Ensured fonts are prefetched with specific patterns: `/assets/fonts/**/*.woff2` and `/assets/fonts/**/*.woff`
- Ensured icons and themes are prefetched for offline use

### 4. Updated manifest.json

- Added `display_override` array with standalone and fullscreen modes
- This provides better iOS PWA display behavior

## How Safe Areas Work

iOS devices with notches (iPhone X and later) and home indicators require special handling. The CSS `env()` function provides values for safe area insets:

```css
env(safe-area-inset-top)     /* Space for notch/status bar */
env(safe-area-inset-bottom)  /* Space for home indicator */
env(safe-area-inset-left)    /* Space for rounded corners */
env(safe-area-inset-right)   /* Space for rounded corners */
```

These values are applied as padding to ensure content doesn't get hidden by system UI elements.

## Testing the Fix

### Before Testing

1. Clear iOS Safari cache and website data
2. Remove the app from home screen if already installed
3. Ensure you're testing with a production build that includes the service worker

### Testing Steps

1. **Build the app**: `npm run build:web:prod` (or your production build command)
2. **Serve the built app**: Use a local server or deploy to staging
3. **Install as PWA on iOS**:
   - Open Safari on iOS
   - Navigate to the app URL
   - Tap Share button
   - Tap "Add to Home Screen"
4. **Test offline mode**:
   - Open the installed PWA
   - Wait for all assets to load (fonts, icons should be visible)
   - Enable Airplane Mode or turn off WiFi
   - Close and reopen the app
   - Verify:
     - ✅ Layout is correct (no weird spacing or overflow)
     - ✅ Content doesn't overlap with notch or home indicator
     - ✅ Fonts load correctly
     - ✅ Icons load correctly
     - ✅ No rubber-band scrolling effect
     - ✅ App remains functional offline

### Testing on Different iOS Devices

- **iPhone with notch** (X, 11, 12, 13, 14, 15, 16): Check safe area handling
- **iPhone without notch** (8, SE): Should work normally without issues
- **iPad**: Test in both portrait and landscape orientations

## Debugging

If you still experience issues, check the following:

### 1. Service Worker Status

```javascript
// In browser console
navigator.serviceWorker.getRegistration().then((reg) => {
  console.log('Service Worker:', reg);
  console.log('Active:', reg.active);
  console.log('Waiting:', reg.waiting);
});
```

### 2. Cache Status

```javascript
// Check what's cached
caches.keys().then((keys) => {
  console.log('Cache keys:', keys);
  keys.forEach((key) => {
    caches.open(key).then((cache) => {
      cache.keys().then((requests) => {
        console.log(
          `Cache ${key}:`,
          requests.map((r) => r.url),
        );
      });
    });
  });
});
```

### 3. Safe Area Insets

```javascript
// Check safe area values
const style = getComputedStyle(document.documentElement);
console.log('Safe area top:', style.getPropertyValue('padding-top'));
console.log('Safe area bottom:', style.getPropertyValue('padding-bottom'));
```

### 4. Enable Debug Mode

In iOS Safari (before installing as PWA):

1. Settings → Safari → Advanced → Web Inspector
2. Connect iOS device to Mac
3. Safari on Mac → Develop → [Your Device] → [Your Page]
4. Check console for errors

## Additional Considerations

### Font Loading

The app uses Open Sans fonts loaded from `/assets/fonts/open-sans/`. These are now prefetched by the service worker. If you add new fonts, update `ngsw-config.json`.

### Material Icons

Material Icons are loaded from `assets/fonts/MaterialIcons-Regular.ttf`. This is included in the assets prefetch pattern.

### Custom Themes

Custom theme CSS files in `assets/themes/` are now prefetched to ensure they work offline.

## Future Improvements

1. **Add preconnect hints** for any external resources
2. **Implement runtime caching** for dynamic content
3. **Add offline fallback page** for uncached routes
4. **Monitor performance** with Lighthouse PWA audit
5. **Test on older iOS versions** (iOS 13, 14, 15)

## Resources

- [iOS PWA Guidelines](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Safe Area Insets](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Angular Service Worker](https://angular.io/guide/service-worker-intro)

## Rollback

If issues persist, you can revert the changes:

```bash
git diff HEAD~1 src/index.html src/styles/page.scss ngsw-config.json src/manifest.json
git checkout HEAD~1 -- src/index.html src/styles/page.scss ngsw-config.json src/manifest.json
```
