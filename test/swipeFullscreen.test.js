import document from 'global/document';
import window from 'global/window';

import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';

import plugin from '../src/plugin';

const createTouch = (el, opts) => {
  if ('Touch' in window) {
    opts.identifier = Date.now();
    opts.target = el;

    return new window.Touch(opts);
  }

  return opts;
};

const createTouchEvent = (el, evt, opts) => {
  if ('TouchEvent' in window) {
    opts.identifier = Date.now();
    opts.target = el;

    opts.touches = opts.touches.map((t) => {
      return createTouch(el, t);
    });
    opts.changedTouches = opts.changedTouches.map((t) => {
      return createTouch(el, t);
    });

    return new window.TouchEvent(evt, opts);
  }

  opts.type = evt;

  return opts;
};

const skipWithoutTouch = 'TouchEvent' in window ? 'test' : 'skip';

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
  assert.strictEqual(typeof plugin, 'function', 'plugin is a function');
});

QUnit.module('swipeFullscreen', {

  beforeEach() {
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

QUnit.test('swipeToFullscreen: adds CSS class when enabled', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: true,
      swipeFromFullscreen: false,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  assert.true(this.player.hasClass('using-fs-swipe-up'), 'adds using-fs-swipe-up class');
  assert.false(this.player.hasClass('using-fs-swipe-down'), 'does not add using-fs-swipe-down class');
});

QUnit.test('swipeFromFullscreen: adds CSS class when enabled', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: false,
      swipeFromFullscreen: true,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  assert.true(this.player.hasClass('using-fs-swipe-down'), 'adds using-fs-swipe-down class');
  assert.false(this.player.hasClass('using-fs-swipe-up'), 'does not add using-fs-swipe-up class');
});

QUnit[skipWithoutTouch]('touch start outside fullscreen', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: true,
      swipeFromFullscreen: true,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  const touchEvent = createTouchEvent(this.player.el(), 'touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 100 }]
  });

  this.player.el().dispatchEvent(touchEvent);

  // Test that the event listener is properly set up
  assert.expect(0);
});

QUnit[skipWithoutTouch]('prevents swiping when feature disabled', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: false,
      swipeFromFullscreen: false,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  sinon.stub(this.player, 'requestFullscreen');

  const touchStart = createTouchEvent(this.player.el(), 'touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 100 }]
  });

  const touchMove = createTouchEvent(this.player.el(), 'touchmove', {
    bubbles: true,
    cancelable: true,
    touches: [{ clientY: 50 }],
    changedTouches: []
  });

  const touchEnd = createTouchEvent(this.player.el(), 'touchend', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 50 }]
  });

  this.player.el().dispatchEvent(touchStart);
  this.player.el().dispatchEvent(touchMove);
  this.player.el().dispatchEvent(touchEnd);

  assert.notOk(this.player.requestFullscreen.called, 'requestFullscreen not called when swipe disabled');
});

QUnit[skipWithoutTouch]('scales element on touch move', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: true,
      swipeFromFullscreen: true,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  const techEl = this.player.tech_.el();

  const touchStart = createTouchEvent(this.player.el(), 'touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 100 }]
  });

  const touchMove = createTouchEvent(this.player.el(), 'touchmove', {
    bubbles: true,
    cancelable: true,
    touches: [{ clientY: 50 }],
    changedTouches: []
  });

  this.player.el().dispatchEvent(touchStart);
  this.player.el().dispatchEvent(touchMove);

  assert.ok(techEl.style.transform.includes('scale('), 'applies scale transform on touch move');
});

QUnit[skipWithoutTouch]('enters fullscreen on swipe up', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: true,
      swipeFromFullscreen: true,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  sinon.stub(this.player, 'isFullscreen').returns(false);
  sinon.stub(this.player, 'requestFullscreen').returns(Promise.resolve());

  const touchStart = createTouchEvent(this.player.el(), 'touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 200 }]
  });

  const touchEnd = createTouchEvent(this.player.el(), 'touchend', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 100 }]
  });

  this.player.el().dispatchEvent(touchStart);
  this.player.el().dispatchEvent(touchEnd);

  assert.true(this.player.requestFullscreen.called, 'requestFullscreen called on swipe up above threshold');
});

QUnit[skipWithoutTouch]('exits fullscreen on swipe down', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: true,
      swipeFromFullscreen: true,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  sinon.stub(this.player, 'isFullscreen').returns(true);
  sinon.stub(this.player, 'exitFullscreen');

  const touchStart = createTouchEvent(this.player.el(), 'touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 100 }]
  });

  const touchEnd = createTouchEvent(this.player.el(), 'touchend', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 200 }]
  });

  this.player.el().dispatchEvent(touchStart);
  this.player.el().dispatchEvent(touchEnd);

  assert.true(this.player.exitFullscreen.called, 'exitFullscreen called on swipe down below threshold');
});

QUnit[skipWithoutTouch]('respects swipe threshold', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: true,
      swipeFromFullscreen: true,
      swipeThreshold: 100
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  sinon.stub(this.player, 'isFullscreen').returns(false);
  sinon.stub(this.player, 'requestFullscreen').returns(Promise.resolve());

  const touchStart = createTouchEvent(this.player.el(), 'touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 200 }]
  });

  // Small swipe (30px) - below 100px threshold
  const touchEnd = createTouchEvent(this.player.el(), 'touchend', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 170 }]
  });

  this.player.el().dispatchEvent(touchStart);
  this.player.el().dispatchEvent(touchEnd);

  assert.notOk(this.player.requestFullscreen.called, 'requestFullscreen not called when swipe below threshold');
});

QUnit[skipWithoutTouch]('handles touchcancel event', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: true,
      swipeFromFullscreen: true,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  sinon.stub(this.player, 'isFullscreen').returns(false);
  sinon.stub(this.player, 'requestFullscreen').returns(Promise.resolve());

  const touchStart = createTouchEvent(this.player.el(), 'touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 200 }]
  });

  const touchCancel = createTouchEvent(this.player.el(), 'touchcancel', {
    bubbles: true,
    cancelable: true,
    touches: [],
    changedTouches: [{ clientY: 100 }],
    type: 'touchcancel'
  });

  this.player.el().dispatchEvent(touchStart);
  this.player.el().dispatchEvent(touchCancel);

  assert.notOk(this.player.requestFullscreen.called, 'requestFullscreen not called on touchcancel');
});

QUnit.test('cleans up event listeners on dispose', function(assert) {
  this.player.mobileUi({
    fullscreen: {
      swipeToFullscreen: true,
      swipeFromFullscreen: true,
      swipeThreshold: 50
    },
    forceForTesting: true
  });

  this.clock.tick(1);

  const rELSpy = sinon.spy(this.player.el(), 'removeEventListener');

  this.player.dispose();

  this.clock.tick(10);

  assert.ok(rELSpy.calledWith('touchstart'), 'removeEventListener called during dispose');

  rELSpy.restore();
});

