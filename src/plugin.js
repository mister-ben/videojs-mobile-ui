import videojs from 'video.js';
import {version as VERSION} from '../package.json';
import './touchOverlay.js';
import initSwipe from './swipeFullscreen.js';
import window from 'global/window';

// Default options for the plugin.
const defaults = {
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

const screen = window.screen;
const registerPlugin = videojs.registerPlugin || videojs.plugin;

/**
 * Gets 'portrait' or 'lanscape' from the two orientation APIs
 *
 * @return {string} orientation
 */
const getOrientation = () => {
  if (screen) {
    // Prefer the string over angle, as 0° can be landscape on some tablets
    const orientationString = ((screen.orientation || {}).type || screen.mozOrientation || screen.msOrientation || '').split('-')[0];

    if (orientationString === 'landscape' || orientationString === 'portrait') {
      return orientationString;
    }
  }

  // iOS only supports window.orientation
  if (typeof window.orientation === 'number') {
    if (window.orientation === 0 || window.orientation === 180) {
      return 'portrait';
    }
    return 'landscape';
  }

  return 'portrait';
};

/**
 * Add UI and event listeners
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player object.
 *
 * @param    {MobileUiOptions} [options={}]
 *           A plain object containing options for the plugin.
 */
const onPlayerReady = (player, options) => {
  player.addClass('vjs-mobile-ui');

  if (!options.touchControls.disabled) {

    if (options.touchControls.disableOnEnd || typeof player.endscreen === 'function') {
      player.addClass('vjs-mobile-ui-disable-end');
    }

    // Insert before the control bar
    let controlBarIdx;
    const versionParts = videojs.VERSION.split('.');
    const major = parseInt(versionParts[0], 10);
    const minor = parseInt(versionParts[1], 10);

    // Video.js < 7.7.0 doesn't account for precedding components that don't have elements
    if (major < 7 || (major === 7 && minor < 7)) {
      controlBarIdx = Array.prototype.indexOf.call(
        player.el_.children,
        player.getChild('ControlBar').el_
      );
    } else {
      controlBarIdx = player.children_.indexOf(player.getChild('ControlBar'));
    }

    player.touchOverlay = player.addChild('TouchOverlay', options.touchControls, controlBarIdx);
  }

  if (options.fullscreen.disabled) {
    return;
  }

  if (options.fullscreen.swipeToFullscreen || options.fullscreen.swipeFromFullscreen) {
    initSwipe(player, options);
  }

  let locked = false;

  const rotationHandler = () => {
    const currentOrientation = getOrientation();

    if (currentOrientation === 'landscape' && options.fullscreen.enterOnRotate) {
      if (!player.paused() && !player.isFullscreen()) {
        player.requestFullscreen().catch((err) => {
          player.log.warn('Browser refused fullscreen request:', err);
        });
        if ((options.fullscreen.lockOnRotate || options.fullscreen.lockToLandscapeOnEnter) &&
            screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').then(() => {
            locked = true;
          }).catch((err) => {
            videojs.log.warn('Browser refused orientation lock:', err);
          });
        }
      }
    } else if (currentOrientation === 'portrait' && options.fullscreen.exitOnRotate && !locked) {
      if (player.isFullscreen()) {
        player.exitFullscreen();
      }
    }
  };

  if (options.fullscreen.enterOnRotate || options.fullscreen.exitOnRotate) {
    if (videojs.browser.IS_IOS) {
      window.addEventListener('orientationchange', rotationHandler);

      player.on('dispose', () => {
        window.removeEventListener('orientationchange', rotationHandler);
      });
    } else if (screen.orientation) {
      // addEventListener('orientationchange') is not a user interaction on Android
      screen.orientation.onchange = rotationHandler;

      player.on('dispose', () => {
        screen.orientation.onchange = null;
      });
    }
  }

  player.on('fullscreenchange', _ => {
    if (player.isFullscreen() && options.fullscreen.lockToLandscapeOnEnter && getOrientation() === 'portrait') {
      screen.orientation.lock('landscape').then(()=>{
        locked = true;
      }).catch((e) => {
        videojs.log('Browser refused orientation lock:', e);
      });
    } else if (!player.isFullscreen() && locked) {
      screen.orientation.unlock();
      locked = false;
    }
  });

  player.on('ended', _ => {
    if (locked === true) {
      screen.orientation.unlock();
      locked = false;
    }
  });
};

/**
 * Adds a mobile UI for player control, and fullscreen orientation control
 *
 * @function mobileUi
 * @param    {Object} [options={}] Plugin options
 */
const mobileUi = function(options = {}) {
  if (options.forceForTesting || videojs.browser.IS_ANDROID || videojs.browser.IS_IOS) {
    this.ready(() => {
      onPlayerReady(this, videojs.mergeOptions(defaults, options));
    });
  }
};

// Register the plugin with video.js.
registerPlugin('mobileUi', mobileUi);

// Include the version number.
mobileUi.VERSION = VERSION;

export default mobileUi;
