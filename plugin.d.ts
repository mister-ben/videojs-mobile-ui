import type Player from 'video.js/dist/types/player';

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

declare function mobileUi(this: Player, options?: mobileUi.MobileUiOptions): void;

export = mobileUi;
