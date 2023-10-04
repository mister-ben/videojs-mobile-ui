import videojs from 'video.js';
import {version as VERSION} from '../package.json';
import TouchOverlay from './touchOverlay.js';
import window from 'global/window';

/**
 * @typedef { import('video.js/dist/types/player').default } Player
 */

/**
 * 
 * @typedef  {Object} TouchOverlayOptions
 * 
 * @property  {boolean} [disabled=false]
 *           If true no touch controls are added.
 * @property  {int} [seekSeconds=10]
 *           Number of seconds to seek on double-tap
 * @property  {int} [tapTimeout=300]
 *           Interval in ms to be considered a doubletap
 * @property  {boolean} [disableOnEnd=false]
 *           Whether to disable when the video ends (e.g., if there is an endscreen)
 *           Never shows if the endscreen plugin is present
 * 
 * 
 * 
 * @typedef   {Object} MobileUIOptions
 *           Plugin options.
 * @property  {boolean} [forceForTesting=false]
 *           Enables the display regardless of user agent, for testing purposes
 * @property  {Object} [fullscreen={}]
 *           Fullscreen options.
 * @property  {boolean} [fullscreen.disabled=false]
 *           If true no fullscreen handling except the *deprecated* iOS fullwindow hack
 * @property  {boolean} [fullscreen.enterOnRotate=true]
 *           Whether to go fullscreen when rotating to landscape
 * @property  {boolean} [fullscreen.exitOnRotate=true]
 *           Whether to leave fullscreen when rotating to portrait (if not locked)
 * @property  {boolean} [fullscreen.lockOnRotate=true]
 *           Whether to lock orientation when rotating to landscape
 *           Unlocked when exiting fullscreen or on 'ended
 * @property  {boolean} [fullscreen.lockToLandscapeOnEnter=false]
 *           Whether to always lock orientation to landscape on fullscreen mode
 *           Unlocked when exiting fullscreen or on 'ended'
 * @property  {TouchOverlayOptions} [touchControls={}]
 *           Touch UI options.
 */

 /* @property  {boolean} [touchControls.disabled=false]
 *           If true no touch controls are added.
 * @property  {int} [touchControls.seekSeconds=10]
 *           Number of seconds to seek on double-tap
 * @property  {int} [touchControls.tapTimeout=300]
 *           Interval in ms to be considered a doubletap
 * @property  {boolean} [touchControls.disableOnEnd=false]
 *           Whether to disable when the video ends (e.g., if there is an endscreen)
 *           Never shows if the endscreen plugin is present
 */

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

/** @type {Screen} */
const screen = window.screen;

/**
 * Gets 'portrait' or 'landscape' from the two orientation APIs
 *
 * @return {'portrait'|'landscape'} orientation
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
 * @param    {MobileUIOptions} [options={}]
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
 * A video.js plugin.
 *
 * Adds a mobile UI for player control, and fullscreen orientation control
 *
 * @function mobileUi
 * @param    {MobileUIOptions} [options={}]
 * @this     Player
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
