import type {} from '../../player';
import type Player from 'video.js/dist/types/player';
import type {MobileUiOptions} from '../../plugin';
import '../..';
import type MobileUiPlugin = require('../../plugin');

declare const mobileUi: typeof MobileUiPlugin;

// Test the plugin's CommonJS API with an existing Video.js player.
declare const player: Player;
const options: MobileUiOptions = {touchControls: {seekSeconds: 10}};
player.mobileUi(options);
mobileUi.call(player, options);
const version: string = mobileUi.VERSION;

// @ts-expect-error options remain checked under verbatimModuleSyntax
mobileUi.call(player, {touchControls: {seekSeconds: '10'}});
