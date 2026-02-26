// Depends on https://github.com/videojs/video.js/pull/8968

import videojs from 'video.js';

declare module 'video.js' {
  interface Player {
    mobileUi: typeof mobileUi;
  }
}

declare namespace mobileUi {
  const VERSION: string;
  interface MobileUiOptions {
    fullscreen?: {
      enterOnRotate?: boolean;
      exitOnRotate?: boolean;
      lockOnRotate?: boolean;
      lockToLandscapeOnEnter?: boolean;
      swipeToFullscreen?: boolean;
      swipeFromFullscreen?: boolean;
      disabled?: boolean;
    };
    touchControls?: {
      seekSeconds?: number;
      tapTimeout?: number;
      disableOnEnd?: boolean;
      disabled?: boolean;
    };
  }
}

declare function mobileUi(options: mobileUi.MobileUiOptions): void;

export = mobileUi;
