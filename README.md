# videojs-mobile-ui

Mobile UI for Video.js.

Touch controls:

- Double-tap the left side of the player to rewind ten seconds
- Double-tap the right side of the player to fast-forward ten seconds
- Single-tap the screen to show a play/pause toggle

Fullscreen control:

- Rotate to landscape to enter Fullscreen
- Lock to fullscreen on rotate
- Always lock to landscape when entering fullscreen (works even when device rotation is disabled/non-functional)

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Plugin Options](#plugin-options)
  - [Default options](#default-options)
  - [Options](#options)
- [Usage](#usage)
  - [`<script>` Tag](#script-tag)
  - [Browserify/CommonJS](#browserifycommonjs)
  - [RequireJS/AMD](#requirejsamd)
  - [Import](#import)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
## Installation

```sh
npm install video.js
npm install videojs-mobile-ui
```

Version 1.x requires video.js 8.x as a peer dependency. Lowever video.js versions are not supported. 0.7.0 supports video.js 7.x. To install the latest version that works with Video.js 7, use the `latest7` tag:

```sh
npm install videojs-mobile-ui@latest7
```

## Plugin Options

### Default options

```js
{
  fullscreen: {
    enterOnRotate: true,
    exitOnRotate: true,
    lockOnRotate: true,
    lockToLandscapeOnEnter: false,
    disabled: false
  },
  touchControls: {
    seekSeconds: 10,
    tapTimeout: 300,
    disableOnEnd: false,
    disabled: false,
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
  If the device is rotated, exit fullscreen.  
  Default `true`.
- **`fullscreen.lockOnRotate`** {boolean}  
  If the device is rotated, lock the orientation (not supported by iOS).  
  Default `true`.
- **`fullscreen.lockToLandscapeOnEnter`** {boolean}  
  When fullscreen is entered, lock the orientation (not supported by iOS).  
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
  Useful if an end screen overlay is used.  
  Default `false`.
- **`touchControls.disabled`** {boolean}  
  All tap overlay functionality provided by this plugin disabled.  
  Default `false`.

## Usage

To include videojs-mobile-ui on your website or web application, use any of the following methods.

### `<script>` Tag

This is the simplest case. Get the script in whatever way you prefer and include the plugin _after_ you include [video.js][videojs], so that the `videojs` global is available.

```html
<link rel="stylesheet" href="//path/to/videojs-mobile-ui.css">  
<script src="//path/to/video.min.js"></script>
<script src="//path/to/videojs-mobile-ui.min.js"></script>
<script>
  var player = videojs('my-video');

  player.mobileUi();
</script>
```

The release versions will be available on jdselivr, unpkg etc.

* https://cdn.jsdelivr.net/npm/videojs-mobile-ui/dist/videojs-mobile-ui.min.js
* https://cdn.jsdelivr.net/npm/videojs-mobile-ui/dist/videojs-mobile-ui.css

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

Also include the CSS.

### RequireJS/AMD

When using with RequireJS (or another AMD library), get the script in whatever way you prefer and `require` the plugin as you normally would:

```js
require(['video.js', 'videojs-mobile-ui'], function(videojs) {
  var player = videojs('my-video');

  player.mobileUi();
});
```

Also include the CSS.

### Import

To import into React etc import both the package and the script

```js
import videojs from 'video.js'
import 'videojs-mobile-ui/dist/videojs-mobile-ui.css';
import 'videojs-mobile-ui';
```

## License

MIT. Copyright (c) mister-ben &lt;git@misterben.me&gt;


[videojs]: http://videojs.com/
