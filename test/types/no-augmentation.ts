import videojs from 'video.js';
import '../..';
import type MobileUiPlugin from '../../plugin';
import type {MobileUiOptions} from '../../plugin';

declare const mobileUi: typeof MobileUiPlugin;

const player = videojs('my-video');
const options: MobileUiOptions = {touchControls: {seekSeconds: 15}};
mobileUi.call(player, options);
const version: string = mobileUi.VERSION;

// @ts-expect-error importing plugin types must not augment Player
player.mobileUi();
// @ts-expect-error exported options are still checked without augmentation
const invalid: MobileUiOptions = {touchControls: {seekSeconds: '15'}};
