import window from 'global/window';
import QUnit from 'qunit';
import videojs from 'video.js';
import '../src/plugin';
import {beforeEach, afterEach, setPlatform} from './helpers/mobile-player';

const init = function(options = {}) {
  this.paused = this.sandbox.stub(this.player, 'paused').returns(false);
  this.fullscreen = this.sandbox.stub(this.player, 'isFullscreen').returns(false);
  this.request = this.sandbox.stub(this.player, 'requestFullscreen').resolves();
  this.exit = this.sandbox.stub(this.player, 'exitFullscreen');
  this.player.mobileUi(options);
  this.clock.tick(1);
};
const rotate = function(type) {
  this.orientation.type = type;
  if (videojs.browser.IS_IOS) {
    window.dispatchEvent(new window.Event('orientationchange'));
  } else if (this.orientation.onchange) {
    this.orientation.onchange();
  }
};
// Flush both the lock promise and its chained rejection handler.
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

QUnit.module('mobile platform detection', {beforeEach, afterEach});

['ios', 'android', 'desktop'].forEach(platform => {
  QUnit.test(`${platform} detection controls initialization`, function(assert) {
    setPlatform.call(this, platform);
    this.player.mobileUi();
    this.clock.tick(1);
    assert.strictEqual(this.player.hasClass('vjs-mobile-ui'), platform !== 'desktop');
    assert.strictEqual(Boolean(this.player.getChild('TouchOverlay')), platform !== 'desktop');
  });
});

QUnit.test('deprecated internal forceForTesting remains compatible on desktop', function(assert) {
  setPlatform.call(this, 'desktop');
  this.player.mobileUi({forceForTesting: true});
  this.clock.tick(1);
  assert.true(this.player.hasClass('vjs-mobile-ui'));
  assert.ok(this.player.getChild('TouchOverlay'));
});

QUnit.module('fullscreen orientation behavior', {beforeEach, afterEach});

['ios', 'android'].forEach(platform => {
  ['landscape-primary', 'landscape-secondary'].forEach(type => {
    QUnit.test(`${platform}: ${type} enters fullscreen while playing`, function(assert) {
      setPlatform.call(this, platform);
      init.call(this);
      rotate.call(this, type);
      assert.true(this.request.calledOnce, 'requests fullscreen');
      assert.true(this.orientation.lock.calledOnceWithExactly('landscape'), 'default locks orientation');
    });
  });
  ['portrait-primary', 'portrait-secondary'].forEach(type => {
    QUnit.test(`${platform}: ${type} exits fullscreen`, function(assert) {
      setPlatform.call(this, platform);
      init.call(this);
      this.fullscreen.returns(true);
      rotate.call(this, type);
      assert.true(this.exit.calledOnce, 'exits fullscreen when unlocked');
    });
  });
  QUnit.test(`${platform}: disposal prevents subsequent rotation actions`, function(assert) {
    setPlatform.call(this, platform);
    init.call(this);
    this.player.dispose();
    rotate.call(this, 'landscape-primary');
    assert.false(this.request.called, 'does not enter fullscreen after disposal');
    assert.false(this.orientation.lock.called, 'does not lock after disposal');
    assert.strictEqual(this.orientation.onchange, null, 'no Android callback remains');
  });
});

[0, 180, 90, -90].forEach(angle => {
  QUnit.test(`iOS angle ${angle} is used without an orientation string`, function(assert) {
    setPlatform.call(this, 'ios');
    this.setProperty(window.screen, 'orientation', undefined);
    window.orientation = angle;
    init.call(this);
    this.fullscreen.returns(angle === 0 || angle === 180);
    rotate.call(this, '');
    assert.strictEqual(this.request.callCount, Math.abs(angle) === 90 ? 1 : 0, 'landscape enters fullscreen');
    assert.strictEqual(this.exit.callCount, Math.abs(angle) === 90 ? 0 : 1, 'portrait exits fullscreen');
  });
});

QUnit.test('orientation strings take precedence over tablet angles', function(assert) {
  window.orientation = 0;
  init.call(this);
  rotate.call(this, 'landscape-primary');
  assert.true(this.request.calledOnce, 'landscape string wins over portrait angle');
  window.orientation = 90;
  this.fullscreen.returns(true);
  rotate.call(this, 'portrait-primary');
  assert.true(this.exit.calledOnce, 'portrait string wins over landscape angle');
});

QUnit.test('unknown orientation falls back to portrait', function(assert) {
  this.orientation.type = 'unknown';
  window.orientation = undefined;
  init.call(this);
  this.fullscreen.returns(true);
  rotate.call(this, 'unknown');
  assert.true(this.exit.calledOnce);
});

['mozOrientation', 'msOrientation'].forEach(property => {
  QUnit.test(`${property} is recognized`, function(assert) {
    this.setProperty(window.screen, property, 'landscape-secondary');
    init.call(this);
    rotate.call(this, '');
    assert.true(this.request.calledOnce);
  });
});

QUnit.test('paused playback and existing fullscreen prevent requests', function(assert) {
  init.call(this);
  this.paused.returns(true);
  rotate.call(this, 'landscape-primary');
  this.paused.returns(false);
  this.fullscreen.returns(true);
  rotate.call(this, 'landscape-primary');
  assert.false(this.request.called);
  assert.false(this.orientation.lock.called);
  this.fullscreen.returns(false);
  rotate.call(this, 'portrait-primary');
  assert.false(this.exit.called, 'does not exit when already outside fullscreen');
});

QUnit.test('individual rotation options are respected', function(assert) {
  init.call(this, {fullscreen: {enterOnRotate: false}});
  rotate.call(this, 'landscape-primary');
  assert.false(this.request.called, 'entry disabled');
  this.fullscreen.returns(true);
  rotate.call(this, 'portrait-primary');
  assert.true(this.exit.calledOnce, 'unspecified exit option retains its default');
});

QUnit.test('exitOnRotate can be disabled independently', function(assert) {
  init.call(this, {fullscreen: {exitOnRotate: false, lockOnRotate: false}});
  rotate.call(this, 'landscape-primary');
  assert.true(this.request.calledOnce);
  assert.false(this.orientation.lock.called, 'locking disabled');
  this.fullscreen.returns(true);
  rotate.call(this, 'portrait-primary');
  assert.false(this.exit.called);
});

QUnit.test('both rotation options disabled leave rotation unregistered', function(assert) {
  init.call(this, {fullscreen: {enterOnRotate: false, exitOnRotate: false}});
  assert.strictEqual(this.orientation.onchange, null);
});

QUnit.test('disabled fullscreen preserves touch controls and disables swipe and rotation', function(assert) {
  init.call(this, {fullscreen: {disabled: true, swipeToFullscreen: true, swipeFromFullscreen: true}});
  assert.ok(this.player.getChild('TouchOverlay'));
  assert.false(this.player.hasClass('using-fs-swipe-up'));
  assert.false(this.player.hasClass('using-fs-swipe-down'));
  rotate.call(this, 'landscape-primary');
  this.fullscreen.returns(true);
  this.player.trigger('fullscreenchange');
  assert.false(this.request.called);
  assert.false(this.orientation.lock.called);
});

QUnit.test('successful rotation lock prevents portrait exit until fullscreen ends', async function(assert) {
  init.call(this);
  rotate.call(this, 'landscape-primary');
  await settle();
  this.fullscreen.returns(true);
  rotate.call(this, 'portrait-primary');
  assert.false(this.exit.called, 'portrait does not exit a locked session');
  this.fullscreen.returns(false);
  this.player.trigger('fullscreenchange');
  assert.true(this.orientation.unlock.calledOnce, 'fullscreen exit unlocks');
  this.fullscreen.returns(true);
  rotate.call(this, 'portrait-primary');
  assert.true(this.exit.calledOnce, 'lock state cleared');
});

QUnit.test('ended unlocks once and clears lock state', async function(assert) {
  init.call(this);
  rotate.call(this, 'landscape-primary');
  await settle();
  this.player.trigger('ended');
  this.player.trigger('ended');
  assert.true(this.orientation.unlock.calledOnce);
  this.fullscreen.returns(true);
  rotate.call(this, 'portrait-primary');
  assert.true(this.exit.calledOnce);
});

QUnit.test('rejected fullscreen requests are handled', async function(assert) {
  const error = new Error('Fullscreen denied');

  init.call(this, {fullscreen: {lockOnRotate: false}});
  const warning = this.sandbox.stub(this.player.log, 'warn');

  this.request.rejects(error);
  rotate.call(this, 'landscape-primary');
  await settle();
  assert.true(warning.calledOnceWithExactly('Browser refused fullscreen request:', error));
});

QUnit.test('rejected rotation lock does not prevent portrait exit', async function(assert) {
  const warning = this.sandbox.stub(videojs.log, 'warn');

  this.orientation.lock.rejects(new Error('Lock denied'));
  init.call(this);
  rotate.call(this, 'landscape-primary');
  await settle();
  this.fullscreen.returns(true);
  rotate.call(this, 'portrait-primary');
  assert.true(warning.calledOnce);
  assert.true(this.exit.calledOnce, 'failed lock does not leave the player locked');
  this.player.trigger('ended');
  assert.false(this.orientation.unlock.called, 'no successful lock to release');
});

QUnit.test('entering fullscreen in portrait locks when requested', async function(assert) {
  init.call(this, {fullscreen: {lockToLandscapeOnEnter: true, lockOnRotate: false}});
  this.fullscreen.returns(true);
  this.player.trigger('fullscreenchange');
  await settle();
  assert.true(this.orientation.lock.calledOnceWithExactly('landscape'));
  rotate.call(this, 'portrait-secondary');
  assert.false(this.exit.called);
  this.player.trigger('ended');
  assert.true(this.orientation.unlock.calledOnce);
});

QUnit.test('entering fullscreen in landscape does not lock again', function(assert) {
  init.call(this, {fullscreen: {lockToLandscapeOnEnter: true}});
  this.orientation.type = 'landscape-primary';
  this.fullscreen.returns(true);
  this.player.trigger('fullscreenchange');
  assert.false(this.orientation.lock.called);
});

QUnit.test('rejected fullscreen-entry lock leaves portrait exit available', async function(assert) {
  init.call(this, {fullscreen: {lockToLandscapeOnEnter: true}});
  this.orientation.lock.rejects(new Error('Lock denied'));
  this.fullscreen.returns(true);
  this.player.trigger('fullscreenchange');
  await settle();
  rotate.call(this, 'portrait-primary');
  assert.true(this.exit.calledOnce);
  this.player.trigger('ended');
  assert.false(this.orientation.unlock.called);
});

[undefined, {type: ''}].forEach(orientation => {
  QUnit.test(`missing ${orientation ? 'lock method' : 'orientation API'} is tolerated`, function(assert) {
    setPlatform.call(this, 'ios');
    this.setProperty(window.screen, 'orientation', orientation);
    init.call(this, {fullscreen: {lockToLandscapeOnEnter: true}});
    window.orientation = 90;
    rotate.call(this, '');
    assert.true(this.request.calledOnce, 'rotation still requests fullscreen without locking support');
    window.orientation = 0;
    this.fullscreen.returns(true);
    this.player.trigger('fullscreenchange');
    rotate.call(this, '');
    assert.true(this.exit.calledOnce, 'portrait exit remains available');
  });
});
