import videojs from 'video.js';
import {version as VERSION} from '../package.json';
import './touchOverlay.js';
import window from 'global/window';

// Default options for the plugin.
const defaults = {
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

const screen = window.screen;

// Cross-compatibility for Video.js 5 and 6.
const registerPlugin = videojs.registerPlugin || videojs.plugin;

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

  if (options.touchControls.disableOnEnd || typeof player.endscreen === 'function') {
    player.addClass('vjs-mobile-ui-disable-end');
  }

  // Insert before the control bar
  const controlBarIdx = player.children_.indexOf(player.getChild('ControlBar')) - 1;

  player.addChild('touchOverlay', options.touchControls, controlBarIdx);

  let locked = false;

  // addEventListener('orientationchange') is not a user interaction ¯\_(ツ)_/¯
  if (options.fullscreen.enterOnRotate && screen.orientation) {
    screen.orientation.onchange = () => {
      if (screen.orientation.angle === 90 || screen.orientation.angle === 270) {
        if (player.paused() === false) {
          player.requestFullscreen();
          if (options.fullscreen.lockOnRoate && screen.orientation.lock) {
            screen.orientation.lock('landscape').then(() => {
              locked = true;
            }).catch(() => {
              videojs.log('orientation lock not allowed');
            });
          }
        }
      }
      if (screen.orientation.angle === 0 || screen.orientation.angle === 180) {
        if (player.isFullscreen()) {
          player.exitFullscreen();
        }
      }
    };
  }

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
 * Adds a monile UI for player control, and fullscreen orientation control
 *
 * @function mobileUi
 * @param    {Object} [options={}]
 *           Plugin options.
 * @param    {Object} [options.fullscreen={}]
 *           Fullscreen options.
 * @param    {boolean} [options.fullscreen.enterOnRotate=true]
 *           Whether to go fullscreen when rotating to landscape
 * @param    {boolean} [options.fullscreen.lockOnRotate=true]
 *           Whether to lock orientation when rotating to landscape
 *           Unlocked when exiting fullscreen or on 'ended'
 * @param    {Object} [options.touchControls={}]
 *           Touch UI options.
 * @param    {int} [options.touchControls.seekSeconds=10]
 *           Number of seconds to seek on double-tap
 * @param    {int} [options.touchControls.tapTimeout=300]
 *           Interval in ms to be considered a doubletap
 * @param    {boolean} [options.touchControls.disableOnEnd=false]
 *           Whether to disable when the video ends (e.g., if there is an endscreen)
 *           Never shows if the endscreen plugin is present
 */
const mobileUi = function(options) {
  if (videojs.browser.IS_ANDROID || videojs.browser.IS_IOS) {
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
