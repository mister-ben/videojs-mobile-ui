import type {} from '../../player';
import videojs from 'video.js';
import mobileUi from '../..';
import type {MobileUiOptions} from '../..';
import type Player from 'video.js/dist/types/player';

const player = videojs('my-video');
const options: MobileUiOptions = {
  fullscreen: {
    enterOnRotate: true,
    exitOnRotate: false,
    lockOnRotate: true,
    lockToLandscapeOnEnter: false,
    swipeToFullscreen: true,
    swipeFromFullscreen: true,
    disabled: false
  },
  touchControls: {
    seekSeconds: 15,
    tapTimeout: 300,
    disableOnEnd: true,
    disabled: false
  }
};

player.mobileUi();
player.mobileUi({});
player.mobileUi({fullscreen: {swipeToFullscreen: true}});
player.mobileUi(options);
const result: void = player.mobileUi();
const version: string = mobileUi.VERSION;
mobileUi.call(player, options);
const explicitPlayer: Player = player;
explicitPlayer.mobileUi();

// @ts-expect-error seekSeconds must be a number
player.mobileUi({touchControls: {seekSeconds: '15'}});
// @ts-expect-error obsolete Video.js 7 option
player.mobileUi({fullscreen: {iOS: true}});
// @ts-expect-error unknown option
player.mobileUi({unknown: true});
// @ts-expect-error function requires a player receiver
mobileUi();
// @ts-expect-error VERSION is assigned after the player wrapper is created
player.mobileUi.VERSION;
