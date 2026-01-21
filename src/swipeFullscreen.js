/** @import Player from 'video.js/dist/types/player' */
/** @import Plugin from 'video.js/dist/types/plugin' */
/** @import {MobileUiOptions} from './plugin' */

/**
 * Sets up swiping to enter and exit fullscreen.
 *
 * @this {Plugin}
 * @param {Player} player
 *  The player to initialise on.
 * @param {MobileUiOptions} pluginOptions
 *  The options used by the mobile ui plugin.
 */
const initSwipe = (player, pluginOptions) => {
  player.addClass('using-fs-swipe');

  let touchStartY = 0;
  let couldBeSwiping = false;
  const swipeThreshold = pluginOptions.fullscreen.swipeThreshold;

  /**
   * @param {TouchEvent} e 
   */
  const onStart = (e) => {
    touchStartY = e.changedTouches[0].screenY;
    couldBeSwiping = true;
  };

  /**
   * @param {TouchEvent} e 
   */
  const onMove = (e) => {
    if (!couldBeSwiping) {
      return;
    }

    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY - currentY;
    const isFullscreen = player.isFullscreen();

    let scale = 1;

    if (!isFullscreen && deltaY > 0) {
      // Swiping up to enter fullscreen: Zoom in (Max 1.1)
      scale = 1 + Math.min(0.1, deltaY / 500);
      player.tech_.el().style.transform = `scale(${scale})`;
    } else if (isFullscreen && deltaY < 0) {
      // Swiping down to exit fullscreen: Zoom out (Min 0.9)
      scale = 1 - Math.min(0.1, Math.abs(deltaY) / 500);
      // console.log(scale);
      player.tech_.el().style.transform = `scale(${scale})`;
    }
  };

  /**
   * @param {TouchEvent} e 
   */
  const onEnd = (e) => {
    if (!couldBeSwiping) {
      return;
    }
    couldBeSwiping = false;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    player.tech_.el().style.transition = 'transform 0.3s ease-out';
    player.tech_.el().style.transform = 'scale(1)';

    console.log(deltaY, swipeThreshold, player.isFullscreen());
    if (deltaY > swipeThreshold && !player.isFullscreen()) {
      player.requestFullscreen();
    } else if (deltaY < -swipeThreshold && player.isFullscreen()) {
      player.exitFullscreen();
    }
  }

  player.el().addEventListener('touchstart', onStart, { passive: true });
  player.el().addEventListener('touchmove', onMove, { passive: true });
  player.el().addEventListener('touchend', onEnd, { passive: true });

  player.on('dispose', () => {
    player.el().removeEventListener('touchstart', onStart);
    player.el().removeEventListener('touchmove', onMove);
    player.el().removeEventListener('touchend', onEnd);
  })

};

export default initSwipe;
