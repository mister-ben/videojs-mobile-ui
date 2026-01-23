import videojs from 'video.js';
import {version as VERSION} from '../package.json';
import './touchOverlay.js';
import initSwipe from './swipeFullscreen.js';
import window from 'global/window';

/**
 * @typedef {Object} MobileUiOptions
 * @property {Object} [fullscreen]
 *  Options for fullscreen behaviours.
 * @property {boolean} [fullscreen.enterOnRotate]
 *  If the device is rotated, enter fullscreen.
 *  Default true.
 * @property {boolean} [fullscreen.exitOnRotate]
 *  If the device is rotated, exit fullscreen.
 *  Default true.
 * @property {boolean} [fullscreen.lockOnRotate]
 *  If the device is rotated, lock the orientation (not supported by iOS).
 *  Default true.
 * @property {boolean} [fullscreen.lockToLandscapeOnEnter]
 *  When fullscreen is entered, lock the orientation (not supported by iOS).
 *  Default false.
 * @property {boolean} [fullscreen.swipeToFullscreen]
 *  Swipe up to enter fullscreen.
 *  Default false.
 * @property {boolean} [fullscreen.swipeFromFullscreen]
 *  Swipe down to exit fullscreen.
 *  Won't do anything on iOS native fullscreen, which has its own swipe down exit gesture.
 *  Default false.
 * @property {boolean} [fullscreen.disabled]
 *  All fullscreen functionality provided by this plugin disabled.
 *  Default false.
 * @property {Object} [touchControls]
 *  Options for tap overlay.
 * @property {number} [touchControls.seekSeconds]
 *  Increment to seek in seconds.
 *  Default 10.
 * @property {number} [touchControls.tapTimeout]
 *  Timeout to tap on the button after display, in ms. ???
 *  Default 300.
 * @property {boolean} [touchControls.disableOnEnd]
 *  Disable the touch overlay when the video ends.
 *  Useful if an end screen overlay is used.
 *  Default false.
 * @property {boolean} [touchControls.disabled]
 *  All tap overlay functionality provided by this plugin disabled.
 *  Default false.
 * @internal
 * @property {boolean} [forceForTesting]
 *  Used in unit tests
 */

/** @type {MobileUiOptions} */
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
    const controlBarIdx = player.children_.indexOf(player.getChild('ControlBar'));

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
      if (player.paused() === false) {
        player.requestFullscreen();
        if ((options.fullscreen.lockOnRotate || options.fullscreen.lockToLandscapeOnEnter) &&
            screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').then(() => {
            locked = true;
          }).catch((e) => {
            videojs.log('Browser refused orientation lock:', e);
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
 * @param    {MobileUiOptions} [options={}]
 */
const mobileUi = function(options = {}) {
  if (options.forceForTesting || videojs.browser.IS_ANDROID || videojs.browser.IS_IOS) {
    this.ready(() => {
      onPlayerReady(this, videojs.obj.merge(defaults, options));
    });
  }
};

// Register the plugin with video.js.
videojs.registerPlugin('mobileUi', mobileUi);

// Include the version number.
mobileUi.VERSION = VERSION;

export default mobileUi;
