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
  const {swipeToFullscreen, swipeFromFullscreen} = pluginOptions.fullscreen;

  if (swipeToFullscreen) {
    player.addClass('using-fs-swipe-up');
  }
  if (swipeFromFullscreen) {
    player.addClass('using-fs-swipe-down');
  }

  let touchStartY = 0;
  let couldBeSwiping = false;
  const swipeThreshold = pluginOptions.fullscreen.swipeThreshold;

  /**
   * Monitor the possible start of a swipe
   *
   * @param {TouchEvent} e Triggering touch event
   */
  const onStart = (e) => {
    const isFullscreen = player.isFullscreen();

    if (
      (!isFullscreen && !swipeToFullscreen) ||
      (isFullscreen && !swipeFromFullscreen)
    ) {
      couldBeSwiping = false;
      return;
    }

    touchStartY = e.changedTouches[0].clientY;
    couldBeSwiping = true;
    player.tech_.el().style.transition = '';
  };

  /**
   * Monitor the movement of a swipe
   *
   * @param {TouchEvent} e Triggering touch event
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
      player.tech_.el().style.transform = `scale(${scale})`;
    }
  };

  /**
   * Monitor the touch end to determine a valid swipe
   *
   * @param {TouchEvent} e Triggering touch event
   */
  const onEnd = (e) => {
    if (!couldBeSwiping) {
      return;
    }
    couldBeSwiping = false;

    player.tech_.el().style.transition = 'transform 0.3s ease-out';
    player.tech_.el().style.transform = 'scale(1)';

    if (e.type === 'touchcancel') {
      return;
    }

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    if (deltaY > swipeThreshold && !player.isFullscreen()) {
      player.requestFullscreen().catch((err) => {
        player.log.warn('Browser refused fullscreen', err);
      });
    } else if (deltaY < -swipeThreshold && player.isFullscreen()) {
      player.exitFullscreen();
    }
  };

  player.el().addEventListener('touchstart', onStart, { passive: true });
  player.el().addEventListener('touchmove', onMove, { passive: true });
  player.el().addEventListener('touchend', onEnd, { passive: true });
  player.el().addEventListener('touchcancel', onEnd, { passive: true });

  player.on('dispose', () => {
    player.el().removeEventListener('touchstart', onStart, { passive: true });
    player.el().removeEventListener('touchmove', onMove, { passive: true });
    player.el().removeEventListener('touchend', onEnd, { passive: true });
    player.el().removeEventListener('touchcancel', onEnd, { passive: true });
    player.tech_.el().style.transform = '';
    player.tech_.el().style.transition = '';
  });

};

export default initSwipe;
