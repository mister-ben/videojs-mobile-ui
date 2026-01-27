import document from 'global/document';
import window from 'global/window';

import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';

import plugin from '../src/plugin';

const Player = videojs.getComponent('Player');

const merge = videojs.obj ? videojs.obj.merge : videojs.mergeOptions;

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
  assert.strictEqual(typeof plugin, 'function', 'plugin is a function');
});

const beforeEach = function() {

  // Mock the environment's timers because certain things - particularly
  // player readiness - are asynchronous in video.js 5. This MUST come
  // before any player is created; otherwise, timers could get created
  // with the actual timer methods!
  this.clock = sinon.useFakeTimers();

  this.fixture = document.getElementById('qunit-fixture');
  this.video = document.createElement('video');
  this.fixture.appendChild(this.video);

  this.player = videojs(this.video);
};

const afterEach = function() {
  if (!this.player.isDisposed()) {
    this.player.dispose();
  }
  this.clock.restore();
};

QUnit.module('videojs-mobile-ui', {
  beforeEach,
  afterEach
});

QUnit.test('registers itself with video.js', function(assert) {

  assert.strictEqual(
    typeof Player.prototype.mobileUi,
    'function',
    'videojs-mobile-ui plugin was registered'
  );
});

QUnit.test('initialises without errors', function(assert) {
  this.player.mobileUi({ forceForTesting: true });

  this.clock.tick(1);

  assert.expect(0);
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

  videojs.browser = merge(videojs.browser, {
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

  videojs.browser = merge(videojs.browser, {
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

  videojs.browser = merge(videojs.browser, {
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

QUnit.test('Adds disable-end class if disableOnEnd option is true', function(assert) {
  this.player.mobileUi({
    forceForTesting: true,
    touchControls: { disableOnEnd: true }
  });

  this.clock.tick(1);

  assert.ok(this.player.hasClass('vjs-mobile-ui-disable-end'), 'Class added via option');
});

QUnit.test('Adds disable-end class if endscreen plugin is present', function(assert) {
  this.player.endscreen = () => {};

  this.player.mobileUi({
    forceForTesting: true,
    touchControls: { disableOnEnd: false }
  });

  this.clock.tick(1);

  assert.ok(this.player.hasClass('vjs-mobile-ui-disable-end'), 'Class added via endscreen detection');
});

QUnit.module('TouchOverlay', {
  beforeEach,
  afterEach
});

QUnit.test('TouchOverlay: double tap right seeks forward', function(assert) {
  // Setup
  this.player.mobileUi({ forceForTesting: true });
  this.clock.tick(1);

  const touchOverlay = this.player.getChild('TouchOverlay');
  const touchEl = touchOverlay.el_;
  let currentTimeCache = 0;

  // Mock bounding rect so clicks have a defined "right" side
  // Width is 100, so > 60 is right side
  sinon.stub(touchEl, 'getBoundingClientRect').returns({
    left: 0,
    width: 100
  });

  this.player.currentTime = (time) => {
    if (time === undefined) {
      return currentTimeCache;
    }
    currentTimeCache = time;
    return currentTimeCache;
  };

  this.player.duration(60);
  this.player.currentTime(10);

  // Trigger first tap
  touchOverlay.handleTap({
    target: touchEl,
    preventDefault: () => {},
    changedTouches: [{ clientX: 90 }]
  });

  // Trigger second tap (double tap)
  touchOverlay.handleTap({
    target: touchEl,
    preventDefault: () => {},
    changedTouches: [{ clientX: 90 }]
  });

  // Fast forward debounce timer (default tapTimeout is 300ms)
  this.clock.tick(310);
  assert.equal(this.player.currentTime(), 20, 'Seeked forward 10 seconds (default)');

  // Advance enough for requestAnimationFrame to trigger
  this.clock.tick(50);
  assert.ok(touchOverlay.hasClass('skip'), 'Skip animation class added');
});

QUnit.test('TouchOverlay: single tap toggles play/pause visibility', function(assert) {
  this.player.mobileUi({ forceForTesting: true });
  this.clock.tick(1);

  const touchOverlay = this.player.getChild('TouchOverlay');

  // Trigger single tap
  touchOverlay.handleTap({
    target: touchOverlay.el_,
    preventDefault: () => {},
    changedTouches: [{ clientX: 50 }]
  });

  assert.ok(touchOverlay.hasClass('show-play-toggle'), 'Play toggle is visible after single tap');
});
