# videojs-mobile-ui

> [!WARNING]
> This branch is a backport for Video.js v7.
> See the master branch for v8.

A more native mobile user experience for Video.js.

**videojs-mobile-ui** augments the standard Video.js experience into a touch-optimized, mobile-first interface. It adds the intuitive gestures and smart behaviors users expect from top-tier video apps to your browser-based player.

## Key Features

### 👆 Touch Controls

Double-tap to Seek: Just like popular video apps, users can double-tap the left or right side of the video to rewind or fast-forward.

Large play/pause overlay: A large, screen-wide touch zone allows for easy Play/Pause toggling without hunting for tiny buttons.

### 📱 Fullscreen Orientation:

Rotate to Watch: Automatically enter fullscreen when the user rotates their phone to landscape.

Orientation Lock: Keeps the video fullscreen and locked to landscape mode even if the user tilts their phone back slightly, preventing accidental exits (works on supported devices).

### 🚀 Swipe Gestures (Optional)

Enable modern swipe gestures to control the viewing mode.

Swipe Up to enter fullscreen with a smooth zoom-in effect.

Swipe Down to exit fullscreen naturally.

### 🎨 Configuration Options

Visual indicators show exactly how many seconds are being skipped during a seek.

Adjust seek times and tap sensitivity to match your specific content needs.

## Compatibility Notes

- iOS Safari does not support orientation lock. The fullscreen video on iOS is native and not influenced by this plugin.
- Android Firefox has native rotate and lock behaviour when an element containing a video is made fullscreen, which will override this plugin.

## Plugin Options

Newer functionality is opt-in, to not force new features on existing players. Things you might want to add:

- `fullscreen.swipeToFullscreen`, to enter fullscreen by swiping up on the video.
- `fullscreen.swipeFromFullscreen`, to exit fullscreen by swiping down on the video (except iPhone).
- `touchControls.disableOnEnd`, to disable the touch controls at the end of the video. Useful if you have any sort of endcard displayed at the end of the video that might otherwise conflict.

The [demo] page lets you try out the configuration options.

![QR code link to demo page][demo-qr]

### Default options

```js
{
  fullscreen: {
    enterOnRotate: true,
    exitOnRotate: true,
    lockOnRotate: true,
    lockToLandscapeOnEnter: false,
    swipeToFullscreen: false,
    swipeFromFullscreen: false,
    disabled: false
  },
  touchControls: {
    seekSeconds: 10,
    tapTimeout: 300,
    disableOnEnd: false,
    disabled: false
  }
};
```

### Options

- **`fullscreen`** {Object}  
  Options for fullscreen behaviours.
- **`fullscreen.enterOnRotate`** {boolean}  
  If the device is rotated, enter fullscreen.  
  Default `true`.
- **`fullscreen.exitOnRotate`** {boolean}  
  If the device is rotated, exit fullscreen, unless `lockOnRotate` is used.  
  Default `true`.
- **`fullscreen.lockOnRotate`** {boolean}  
  When going fullscreen in response to rotation (`enterOnRotate`), also lock the orientation (not supported by iOS).  
  Default `true`.
- **`fullscreen.lockToLandscapeOnEnter`** {boolean}  
  When fullscreen is entered by any means, lock the orientation (not supported by iOS).  
  Default `false`.
- **`fullscreen.swipeToFullscreen`** {boolean}  
  Swipe up to enter fullscreen.  
  Default `false`.
- **`fullscreen.swipeFromFullscreen`** {boolean}  
  Swipe down to exit fullscreen.  
  Won't do anything on iOS native fullscreen, which has its own swipe down exit gesture.  
  Default `false`.
- **`fullscreen.disabled`** {boolean}  
  All fullscreen functionality provided by this plugin disabled.  
  Default `false`.
- **`touchControls`** {Object}  
  Options for tap overlay.
- **`touchControls.seekSeconds`** {number}  
  Increment to seek in seconds.  
  Default `10`.
- **`touchControls.tapTimeout`** {number}  
  Timeout to consider multiple taps as double rather than two single.  
  Default `300`.
- **`touchControls.disableOnEnd`** {boolean}  
  Disable the touch overlay when the video ends.  
  Useful if an end screen overlay is used to avoid conflict.  
  Default `false`.
- **`touchControls.disabled`** {boolean}  
  All tap overlay functionality provided by this plugin disabled.  
  Default `false`.

## Installation

Version 1.x requires video.js 8.x as a peer dependency. Lower video.js versions are not supported.

Version 0.x works with Video.js 7. To install the latest release of 0.x, use the `latest7` tag:

```sh
npm install videojs-mobile-ui@latest7
```

To include videojs-mobile-ui on your website or web application, use any of the following methods.

### `<script>` Tag

This is the simplest case. Get the script in whatever way you prefer and include the plugin _after_ you include [video.js][videojs], so that the `videojs` global is available.

```html
<link rel="stylesheet" href="//path/to/videojs-mobile-ui.css">  
<script src="//path/to/video.min.js"></script>
<script src="//path/to/videojs-mobile-ui.min.js"></script>
<script>
  const player = videojs('my-video');
  const pluginOptions = {
    {
      fullscreen: {
        swipeToFullscreen: true
      } 
    }
  };

  player.mobileUi(pluginOptions);
</script>
```

The release versions will be available on jdselivr, unpkg etc.

- https://cdn.jsdelivr.net/npm/videojs-mobile-ui/dist/videojs-mobile-ui.min.js
- https://cdn.jsdelivr.net/npm/videojs-mobile-ui/dist/videojs-mobile-ui.css

### Browserify/CommonJS

When using with Browserify, install videojs-mobile-ui via npm and `require` the plugin as you would any other module.

```js
var videojs = require('video.js');

// The actual plugin function is exported by this module, but it is also
// attached to the `Player.prototype`; so, there is no need to assign it
// to a variable.
require('videojs-mobile-ui');

var player = videojs('my-video');

player.mobileUi();
```

Also include the CSS!

### RequireJS/AMD

When using with RequireJS (or another AMD library), get the script in whatever way you prefer and `require` the plugin as you normally would:

```js
require(['video.js', 'videojs-mobile-ui'], function(videojs) {
  var player = videojs('my-video');

  player.mobileUi();
});
```

Also include the CSS!

### Import

To import into React etc import both the package and the script

```js
import videojs from 'video.js'
import 'videojs-mobile-ui/dist/videojs-mobile-ui.css';
import 'videojs-mobile-ui';
```

## License

MIT. Copyright (c) mister-ben &lt;git@misterben.me&gt;

[videojs]: http://videojs.org/
[demo]: https://videojs-mobile-ui.netlify.app
[demo-qr]: /demo-qr.svg
