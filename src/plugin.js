import videojs from 'video.js';
import {version as VERSION} from '../package.json';
import './touchOverlay.js';
import { window } from './global.js';

// Default options for the plugin.
const defaults = {
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
    disabled: false
  }
};

/**
 * Gets 'portrait' or 'lanscape' from the two orientation APIs
 *
 * @return {string} orientation
 */
const getOrientation = () => {
  if (window.screen) {
    // Prefer the string over angle, as 0° can be landscape on some tablets
    const orientationString = ((window.screen.orientation || {}).type || window.screen.mozOrientation || window.screen.msOrientation || '').split('-')[0];

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
 * @param    {Object} [options={}]
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

  let locked = false;

  const rotationHandler = () => {
    const currentOrientation = getOrientation();

    if (currentOrientation === 'landscape' && options.fullscreen.enterOnRotate) {
      if (player.paused() === false) {
        player.requestFullscreen();
        if ((options.fullscreen.lockOnRotate || options.fullscreen.lockToLandscapeOnEnter) &&
            window.screen.orientation && window.screen.orientation.lock) {
          window.screen.orientation.lock('landscape').then(() => {
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
    } else if (window.screen.orientation) {
      // addEventListener('orientationchange') is not a user interaction on Android
      window.screen.orientation.onchange = rotationHandler;

      player.on('dispose', () => {
        window.screen.orientation.onchange = null;
      });
    }
  }

  player.on('fullscreenchange', _ => {
    if (player.isFullscreen() && options.fullscreen.lockToLandscapeOnEnter && getOrientation() === 'portrait') {
      window.screen.orientation.lock('landscape').then(()=>{
        locked = true;
      }).catch((e) => {
        videojs.log('Browser refused orientation lock:', e);
      });
    } else if (!player.isFullscreen() && locked) {
      window.screen.orientation.unlock();
      locked = false;
    }
  });

  player.on('ended', _ => {
    if (locked === true) {
      window.screen.orientation.unlock();
      locked = false;
    }
  });
};

/**
 * A video.js plugin.
 *
 * Adds a monile UI for player control, and fullscreen orientation control
 *
 * @function mobileUi
 * @param    {Object} [options={}]
 *           Plugin options.
 * @param    {boolean} [options.forceForTesting=false]
 *           Enables the display regardless of user agent, for testing purposes
 * @param    {Object} [options.fullscreen={}]
 *           Fullscreen options.
 * @param    {boolean} [options.fullscreen.disabled=false]
 *           If true no fullscreen handling except the *deprecated* iOS fullwindow hack
 * @param    {boolean} [options.fullscreen.enterOnRotate=true]
 *           Whether to go fullscreen when rotating to landscape
 * @param    {boolean} [options.fullscreen.exitOnRotate=true]
 *           Whether to leave fullscreen when rotating to portrait (if not locked)
 * @param    {boolean} [options.fullscreen.lockOnRotate=true]
 *           Whether to lock orientation when rotating to landscape
 *           Unlocked when exiting fullscreen or on 'ended
 * @param    {boolean} [options.fullscreen.lockToLandscapeOnEnter=false]
 *           Whether to always lock orientation to landscape on fullscreen mode
 *           Unlocked when exiting fullscreen or on 'ended'
 * @param    {Object} [options.touchControls={}]
 *           Touch UI options.
 * @param    {boolean} [options.touchControls.disabled=false]
 *           If true no touch controls are added.
 * @param    {int} [options.touchControls.seekSeconds=10]
 *           Number of seconds to seek on double-tap
 * @param    {int} [options.touchControls.tapTimeout=300]
 *           Interval in ms to be considered a doubletap
 * @param    {boolean} [options.touchControls.disableOnEnd=false]
 *           Whether to disable when the video ends (e.g., if there is an endscreen)
 *           Never shows if the endscreen plugin is present
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
