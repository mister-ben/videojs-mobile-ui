import document from 'global/document';
import window from 'global/window';
import QUnit from 'qunit';

QUnit.module('mobile UI stylesheet', {
  beforeEach() {
    this.root = document.createElement('div');
    this.root.className = 'video-js vjs-mobile-ui';
    this.overlay = document.createElement('div');
    this.overlay.className = 'vjs-touch-overlay';
    this.control = document.createElement('button');
    this.control.className = 'vjs-play-control';
    this.control.style.transition = 'none';
    this.icon = document.createElement('span');
    this.icon.className = 'vjs-icon-placeholder';
    this.control.appendChild(this.icon);
    this.overlay.appendChild(this.control);
    this.root.appendChild(this.overlay);
    document.getElementById('qunit-fixture').appendChild(this.root);
  },
  afterEach() {
    this.root.parentNode.removeChild(this.root);
  }
});

QUnit.test('overlay captures touches only after playback starts and outside ads', function(assert) {
  assert.strictEqual(window.getComputedStyle(this.overlay).pointerEvents, 'none');
  this.root.classList.add('vjs-has-started');
  assert.strictEqual(window.getComputedStyle(this.overlay).pointerEvents, 'auto');
  assert.strictEqual(window.getComputedStyle(this.overlay).position, 'absolute');
  this.root.classList.add('vjs-ad-playing');
  assert.strictEqual(window.getComputedStyle(this.overlay).pointerEvents, 'none');
});

QUnit.test('play toggle visibility, playback icons and end-screen state', function(assert) {
  assert.strictEqual(window.getComputedStyle(this.control).opacity, '0');
  assert.strictEqual(window.getComputedStyle(this.control).pointerEvents, 'none');
  this.overlay.classList.add('show-play-toggle');
  assert.strictEqual(window.getComputedStyle(this.control).opacity, '1');
  assert.strictEqual(window.getComputedStyle(this.control).pointerEvents, 'auto');

  const playing = window.getComputedStyle(this.icon, '::before').backgroundImage;

  this.control.classList.add('vjs-paused');
  const paused = window.getComputedStyle(this.icon, '::before').backgroundImage;

  assert.notStrictEqual(paused, playing, 'paused icon differs from playing icon');
  this.control.classList.add('vjs-ended');
  assert.notStrictEqual(window.getComputedStyle(this.icon, '::before').backgroundImage, paused, 'ended icon overrides paused icon');
  this.root.classList.add('vjs-mobile-ui-disable-end', 'vjs-ended');
  assert.strictEqual(window.getComputedStyle(this.overlay).display, 'none');
});

QUnit.test('seek indicators retain their animation, text and direction', function(assert) {
  this.overlay.classList.add('skip');
  this.overlay.setAttribute('data-skip-text', '20 seconds');
  assert.strictEqual(window.getComputedStyle(this.overlay).animationName, 'fadeAndScale');
  assert.ok(window.getComputedStyle(this.overlay).backgroundPosition.startsWith('80%'));
  assert.ok(window.getComputedStyle(this.overlay, '::after').content.includes('20 seconds'));
  const forward = window.getComputedStyle(this.overlay).backgroundImage;

  this.overlay.classList.add('reverse');
  assert.ok(window.getComputedStyle(this.overlay).backgroundPosition.startsWith('20%'));
  assert.notStrictEqual(window.getComputedStyle(this.overlay).backgroundImage, forward, 'reverse icon differs from forward icon');
});
