import type Player from 'video.js/dist/types/player';

declare namespace mobileUi {
  const VERSION: string;
  // BEGIN GENERATED OPTIONS
  // Generated from src/plugin.js by npm run docs:options.
  interface MobileUiOptions {
    /**
     * Options for fullscreen behaviours.
     */
    fullscreen?: {
      /**
       * If the device is rotated, enter fullscreen.
       * Default `true`.
       */
      enterOnRotate?: boolean;
      /**
       * If the device is rotated, exit fullscreen, unless `lockOnRotate` is used.
       * Default `true`.
       */
      exitOnRotate?: boolean;
      /**
       * When going fullscreen in response to rotation (`enterOnRotate`), also lock the orientation (not supported by iOS).
       * Default `true`.
       */
      lockOnRotate?: boolean;
      /**
       * When fullscreen is entered by any means, lock the orientation (not supported by iOS).
       * Default `false`.
       */
      lockToLandscapeOnEnter?: boolean;
      /**
       * Swipe up to enter fullscreen.
       * Default `false`.
       */
      swipeToFullscreen?: boolean;
      /**
       * Swipe down to exit fullscreen.
       * Won't do anything on iOS native fullscreen, which has its own swipe down exit gesture.
       * Default `false`.
       */
      swipeFromFullscreen?: boolean;
      /**
       * All fullscreen functionality provided by this plugin disabled.
       * Default `false`.
       */
      disabled?: boolean;
    };
    /**
     * Options for tap overlay.
     */
    touchControls?: {
      /**
       * Increment to seek in seconds.
       * Default `10`.
       */
      seekSeconds?: number;
      /**
       * Timeout to consider multiple taps as double rather than two single.
       * Default `300`.
       */
      tapTimeout?: number;
      /**
       * Disable the touch overlay when the video ends.
       * Useful if an end screen overlay is used to avoid conflict.
       * Default `false`.
       */
      disableOnEnd?: boolean;
      /**
       * All tap overlay functionality provided by this plugin disabled.
       * Default `false`.
       */
      disabled?: boolean;
    };
  }
  // END GENERATED OPTIONS
}

declare function mobileUi(this: Player, options?: mobileUi.MobileUiOptions): void;

export = mobileUi;
