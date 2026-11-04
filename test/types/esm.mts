// Node16 ESM uses .js specifiers even when the targets are declarations.
import type {} from '../../player.js';
import type MobileUiPlugin from '../../plugin.js';
import type {MobileUiOptions} from '../../plugin.js';

declare const mobileUi: typeof MobileUiPlugin;

// Declaration-only imports must not introduce a runtime plugin.js import.
declare const player: ThisParameterType<typeof mobileUi>;
const options: MobileUiOptions = {touchControls: {seekSeconds: 15}};
player.mobileUi(options);
mobileUi.call(player, options);
const version: string = mobileUi.VERSION;

// @ts-expect-error options remain checked under verbatimModuleSyntax
player.mobileUi({touchControls: {seekSeconds: '15'}});
