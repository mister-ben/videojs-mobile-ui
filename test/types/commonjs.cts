import type {} from '../../player';
import videojs from 'video.js';
import mobileUi = require('../..');

const player = videojs('my-video');
player.mobileUi();
mobileUi.call(player, {touchControls: {seekSeconds: 10}});
const version: string = mobileUi.VERSION;
