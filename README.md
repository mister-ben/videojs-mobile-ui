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
## Installation

- [Installation](#installation)
- [Plugin Options](#plugin-options)
  - [Default options](#default-options)
  - [Options](#options)
- [Usage](#usage)
  - [`<script>` Tag](#script-tag)
  - [Browserify/CommonJS](#browserifycommonjs)
  - [RequireJS/AMD](#requirejsamd)
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

- *fullscreen.enterOnRotate* `boolean` Whether to go fullscreen when rotating to landscape
- *fullscreen.exitOnRotate* `boolean` Whether to leave fullscreen when rotating to portrait (if not locked)
- *fullscreen.lockOnRotate* `boolean` Whether to lock to fullscreen when rotating to landscape
- *fullscreen.lockToLandscapeOnEnter* `boolean` Whether to lock to landscape when entering fullscreen (works even when device rotation is disabled/non-functional)
- *fullscreen.disabled* `boolean` If true no fullscreen handling except the *deprecated* iOS fullwindow hack
- *touchControls.seekSeconds* `int` Seconds to seek when double-tapping
- *touchControls.tapTimeout* `int` Milliseconds to consider a double-tap
- *touchControls.disableOnEnd* `boolean` Whether to disable touch controls when the video has ended, e.g. if an endscreen is used. Automatically disables if the endscreen plugin is present when this plugin initialises
- *touchControls.disabled* `boolean` If true no touch controls are added.

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
