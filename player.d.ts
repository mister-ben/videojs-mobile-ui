import type {MobileUiOptions} from './plugin';
import type Player from 'video.js/dist/types/player';

declare module 'video.js/dist/types/player' {
  export default interface Player {
    mobileUi(options?: MobileUiOptions): void;
  }
}

export {};
