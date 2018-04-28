/**
 * @file touchOverlay.js
 * Touch UI component
 */

import videojs from 'video.js';
import window from 'global/window';

const Component = videojs.getComponent('Component');
const dom = videojs.dom || videojs;

/**
 * The `TouchOverlay` is an overlay to capture tap events.
 *
 * @extends Component
 */
class TouchOverlay extends Component {

  /**
  * Creates an instance of the this class.
  *
  * @param  {Player} player
  *         The `Player` that this class should be attached to.
  *
  * @param  {Object} [options]
  *         The key/value store of player options.
  */
  constructor(player, options) {
    super(player, options);

    this.seekSeconds = options.seekSeconds;
    this.tapTimeout = options.tapTimeout;

    // Add play toggle overlay
    this.addChild('playToggle', {});

    // Clear overlay when playback starts or with control fade
    player.on(['playing', 'userinactive'], e => {
      this.removeClass('show-play-toggle');
    });

    this.enable();
  }

  /**
   * Builds the DOM element.
   *
   * @return {Element}
   *         The DOM element.
   */
  createEl() {
    const el = dom.createEl('div', {
      className: 'vjs-touch-overlay',
      // Touch overlay is not tabbable.
      tabIndex: -1
    });

    return el;
  }

  /**
  * Debounces to either handle a delayed single tap, or a double tap
   *
   * @param {Event} event
   *        The touch event
   *
   */
  handleTap(event) {
    // Don't handle taps on the play button
    if (event.target !== this.el_) {
      return;
    }

    if (this.firstTapCaptured) {
      this.firstTapCaptured = false;
      if (this.timeout) {
        window.clearTimeout(this.timeout);
      }
      this.handleDoubleTap(event);
    } else {
      this.firstTapCaptured = true;
      this.timeout = window.setTimeout(() => {
        this.firstTapCaptured = false;
        this.handleSingleTap(event);
      }, this.tapTimeout);
    }
  }

  /**
   * Toggles display of play toggle
   *
   * @param {Event} event
   *        The touch event
   *
   */
  handleSingleTap(event) {
    event.preventDefault();
    this.removeClass('skip');
    this.toggleClass('show-play-toggle');
  }

  /**
   * Seeks by configured number of seconds if left or right part of video double tapped
   *
   * @param {Event} event
   *        The touch event
   *
   */
  handleDoubleTap(event) {
    event.preventDefault();

    // Check if double tap is in left or right area
    if (event.changedTouches[0].clientX < event.target.offsetWidth * 0.4) {
      this.player_.currentTime(Math.max(
        0, this.player_.currentTime() - this.seekSeconds));
      this.addClass('reverse');
    } else if (event.changedTouches[0].clientX >
               event.target.offsetWidth - (event.target.offsetWidth * 0.4)) {
      this.player_.currentTime(Math.min(
        this.player_.duration(), this.player_.currentTime() + this.seekSeconds));
      this.removeClass('reverse');
    } else {
      return;
    }

    // Remove play toggle if showing
    this.removeClass('show-play-toggle');

    // Remove and readd class to trigger animation
    this.removeClass('skip');
    window.requestAnimationFrame(() => {
      this.addClass('skip');
    });
  }

  /**
   * Enables touch handler
   */
  enable() {
    this.firstTapCaptured = false;
    this.on('touchend', this.handleTap);
  }

  /**
   * Disables touch handler
   */
  disable() {
    this.off('touchend', this.handleTap);
  }

}

Component.registerComponent('TouchOverlay', TouchOverlay);
export default TouchOverlay;
