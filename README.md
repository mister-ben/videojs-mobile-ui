# videojs-mobile-ui

Mobile UI for Video.js.

Touch controls:

- Double-tap the left side of the player to rewind ten seconds
- Double-tap the right side of the player to fast-forward ten seconds
- Single-tap the screen to show a play/pause toggle

Fullscreen control:

- Rotate to landscape to enter Fullscreen
- Lock to fullscreen on rotate

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
npm install --save videojs-mobile-ui
```

## Plugin Options

### Default options

```js
{
  fullscreen: {
    enterOnRotate: true,
    lockOnRotate: true
  },
  touchControls: {
    seekSeconds: 10,
    tapTimeout: 300,
    disableOnEnd: false
  }
};
```

### Options

- *fullscreen.enterOnRotate* `boolean` Whether to go fullscreen when rotating to landscape
- *fullscreen.lockOnRotate* `boolean` Whether to lock to fullscreen when rotating to landscape
- *fullscreen.iOS* `boolean` Whether to use fake fullscreen on iOS (needed for controls to work)
- *touchControls.seekSeconds* `int` Seconds to seek when double-tapping
- *touchControls.tapTimeout* `int` Milliseconds to consider a double-tap
- *touchControls.disableOnEnd* `boolean` Whether to disable touch controls when the video has ended, e.g. if an endscreen is used. Automatically disables if the endscreen plugin is present when this plugin initialises

## Usage

To include videojs-mobile-ui on your website or web application, use any of the following methods.

### `<script>` Tag

This is the simplest case. Get the script in whatever way you prefer and include the plugin _after_ you include [video.js][videojs], so that the `videojs` global is available.

```html
<script src="//path/to/video.min.js"></script>
<script src="//path/to/videojs-mobile-ui.min.js"></script>
<script>
  var player = videojs('my-video');

  player.mobileUi();
</script>
```

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

### RequireJS/AMD

When using with RequireJS (or another AMD library), get the script in whatever way you prefer and `require` the plugin as you normally would:

```js
require(['video.js', 'videojs-mobile-ui'], function(videojs) {
  var player = videojs('my-video');

  player.mobileUi();
});
```

## License

MIT. Copyright (c) mister-ben &lt;git@misterben.me&gt;


[videojs]: http://videojs.com/
