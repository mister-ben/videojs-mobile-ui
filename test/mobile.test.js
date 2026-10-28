import document from 'global/document';
import window from 'global/window';
import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';

// Desktop runs keep their existing test set and coverage baseline.
if (window.__karma__ && window.__karma__.config.mobileCompatibility) {
  QUnit.module('real mobile environment');

  QUnit.test('provides native mobile detection and touch APIs', function(assert) {
    assert.ok(videojs.browser.IS_IOS || videojs.browser.IS_ANDROID, 'Video.js identifies a mobile platform');
    assert.strictEqual(typeof window.TouchEvent, 'function', 'native TouchEvent is available');
    assert.strictEqual(typeof window.Touch, 'function', 'native Touch is available');
    assert.ok(window.screen.orientation || typeof window.orientation === 'number', 'an orientation API is available');
  });

  QUnit.test('initialises through mobile detection without forceForTesting', function(assert) {
    const clock = sinon.useFakeTimers();
    const video = document.createElement('video');
    let player;

    video.setAttribute('playsinline', '');
    document.getElementById('qunit-fixture').appendChild(video);
    try {
      player = videojs(video);
      player.mobileUi();
      clock.tick(1);
      assert.ok(player.hasClass('vjs-mobile-ui'), 'mobile detection enables the plugin');
      assert.ok(player.getChild('TouchOverlay'), 'touch overlay is registered on the real device');
    } finally {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
      clock.restore();
    }
  });
}
