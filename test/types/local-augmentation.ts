import videojs from 'video.js';
import '../..';
import type Player from 'video.js/dist/types/player';

// A consumer can retain its existing local declaration until it opts in.
declare module 'video.js/dist/types/player' {
  export default interface Player {
    mobileUi: {
      (options?: {touchControls?: {seekSeconds?: number}}): void;
      VERSION: string;
    };
  }
}

const player = videojs('my-video');
player.mobileUi({touchControls: {seekSeconds: 15}});
const version: string = player.mobileUi.VERSION;
