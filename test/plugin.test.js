import document from 'global/document';
import window from 'global/window';

import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';

import plugin from '../src/plugin';

const Player = videojs.getComponent('Player');

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
  assert.strictEqual(typeof plugin, 'function', 'plugin is a function');
});

QUnit.module('videojs-mobile-ui', {

  beforeEach() {

    // Mock the environment's timers because certain things - particularly
    // player readiness - are asynchronous in video.js 5. This MUST come
    // before any player is created; otherwise, timers could get created
    // with the actual timer methods!
    this.clock = sinon.useFakeTimers();

    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);
  },

  afterEach() {
    if (!this.player.isDisposed()) {
      this.player.dispose();
    }
    this.clock.restore();
  }
});

QUnit.test('registers itself with video.js', function(assert) {

  assert.strictEqual(
    typeof Player.prototype.mobileUi,
    'function',
    'videojs-mobile-ui plugin was registered'
  );
});

QUnit.test('inserts element before control bar', function(assert) {

  this.player.mobileUi({forceForTesting: true});

  this.clock.tick(1);

  assert.strictEqual(
    this.player.getChild('TouchOverlay').el_.nextSibling,
    this.player.getChild('ControlBar').el_,
    'TouchOverlay is before ControlBar'
  );
});

QUnit.test('does not insert if disabled', function(assert) {

  this.player.mobileUi({
    forceForTesting: true,
    touchControls: {
      disabled: true
    }
  });

  this.clock.tick(1);

  assert.strictEqual(
    this.player.touchOverlay,
    undefined,
    'TouchOverlay should not be present'
  );
});

QUnit.test('iOS event listeners', function(assert) {

  const oldBrowser = videojs.browser;

  videojs.browser = videojs.mergeOptions(videojs.browser, {
    IS_IOS: true,
    IS_ANDROID: false
  });

  const addSpy = sinon.spy(window, 'addEventListener');
  const removeSpy = sinon.spy(window, 'removeEventListener');

  this.player.mobileUi({ forceForTesting: true });

  this.clock.tick(1);

  assert.strictEqual(
    'orientationchange',
    addSpy.getCall(0).args[0],
    'orientationchange listener added'
  );

  this.player.dispose();

  this.clock.tick(1);

  assert.strictEqual(
    'orientationchange',
    removeSpy.getCall(0).args[0],
    'orientationchange listener removed when player disposed'
  );

  addSpy.restore();
  removeSpy.restore();

  videojs.browser = oldBrowser;
});

const testOrSkip = (window.screen && window.screen.orientation) ? 'test' : 'skip';

QUnit[testOrSkip]('Android event listeners', function(assert) {

  const oldBrowser = videojs.browser;

  videojs.browser = videojs.mergeOptions(videojs.browser, {
    IS_IOS: false,
    IS_ANDROID: true
  });

  this.player.mobileUi({forceForTesting: true});

  this.clock.tick(1);

  assert.strictEqual(
    typeof window.screen.orientation.onchange,
    'function',
    'screen.orientation.onchange is used for android'
  );

  this.player.dispose();

  this.clock.tick(1);

  assert.strictEqual(
    window.screen.orientation.onchange,
    null,
    'screen.orientation.onchange is removed after dispose'
  );

  videojs.browser = oldBrowser;
});

QUnit[testOrSkip]('Android event listeners skipped if disabled', function(assert) {

  const oldBrowser = videojs.browser;

  videojs.browser = videojs.mergeOptions(videojs.browser, {
    IS_IOS: false,
    IS_ANDROID: true
  });

  this.player.mobileUi({
    forceForTesting: true,
    fullscreen: {
      disabled: true
    }
  });

  this.clock.tick(1);

  assert.notStrictEqual(
    typeof window.screen.orientation.onchange,
    'function',
    'screen.orientation.onchange skipped for android'
  );

  videojs.browser = oldBrowser;
});
