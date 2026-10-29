import document from 'global/document';
import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';

import plugin from '../src/plugin';
import {beforeEach, afterEach} from './helpers/mobile-player';

const Player = videojs.getComponent('Player');

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
  assert.strictEqual(typeof plugin, 'function', 'plugin is a function');
});

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
  this.player.mobileUi();

  this.clock.tick(1);

  assert.true(this.player.hasClass('vjs-mobile-ui'), 'mobile UI initialized');
});

QUnit.test('inserts element before control bar', function(assert) {

  this.player.mobileUi();

  this.clock.tick(1);

  assert.strictEqual(
    this.player.getChild('TouchOverlay').el_.nextSibling,
    this.player.getChild('ControlBar').el_,
    'TouchOverlay is before ControlBar'
  );
});

QUnit.test('does not insert if disabled', function(assert) {

  this.player.mobileUi({
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

QUnit.test('Adds disable-end class if disableOnEnd option is true', function(assert) {
  this.player.mobileUi({
    touchControls: { disableOnEnd: true }
  });

  this.clock.tick(1);

  assert.ok(this.player.hasClass('vjs-mobile-ui-disable-end'), 'Class added via option');
});

QUnit.test('Adds disable-end class if endscreen plugin is present', function(assert) {
  this.player.endscreen = () => {};

  this.player.mobileUi({
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
  this.player.mobileUi();
  this.clock.tick(1);

  const touchOverlay = this.player.getChild('TouchOverlay');
  const touchEl = touchOverlay.el_;
  let currentTimeCache = 0;

  // Mock bounding rect so clicks have a defined "right" side
  // Width is 100, so > 60 is right side
  this.sandbox.stub(touchEl, 'getBoundingClientRect').returns({
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
  this.player.mobileUi();
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

QUnit.test('partial options retain defaults without leaking between players', function(assert) {
  this.player.mobileUi({fullscreen: {disabled: true}, touchControls: {seekSeconds: 25}});
  this.clock.tick(1);
  const firstOverlay = this.player.getChild('TouchOverlay');
  const video = document.createElement('video');

  this.fixture.appendChild(video);
  const second = videojs(video);

  try {
    second.mobileUi({fullscreen: {disabled: true}});
    this.clock.tick(1);
    const secondOverlay = second.getChild('TouchOverlay');

    assert.strictEqual(firstOverlay.options().seekSeconds, 25, 'custom seek increment');
    assert.strictEqual(firstOverlay.options().tapTimeout, 300, 'partial options retain tap timeout');
    assert.strictEqual(secondOverlay.options().seekSeconds, 10, 'next player retains default seek increment');
    assert.strictEqual(secondOverlay.options().tapTimeout, 300, 'next player retains default timeout');
  } finally {
    second.dispose();
  }
});
