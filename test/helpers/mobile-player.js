import document from 'global/document';
import window from 'global/window';
import sinon from 'sinon';
import videojs from 'video.js';

export const setPlatform = function(platform) {
  this.ios.value(platform === 'ios');
  this.android.value(platform === 'android');
};

export const beforeEach = function() {
  this.sandbox = sinon.createSandbox();
  this.clock = this.sandbox.useFakeTimers();
  this.ios = this.sandbox.stub(videojs.browser, 'IS_IOS').value(false);
  this.android = this.sandbox.stub(videojs.browser, 'IS_ANDROID').value(true);
  this.restoreProperties = [];
  // Shadow browser-owned read-only properties, then restore their descriptors.
  this.setProperty = (object, key, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);

    Object.defineProperty(object, key, {configurable: true, writable: true, value});
    this.restoreProperties.push(() => {
      if (descriptor) {
        Object.defineProperty(object, key, descriptor);
      } else {
        delete object[key];
      }
    });
  };
  this.orientation = {
    type: 'portrait-primary',
    onchange: null,
    lock: this.sandbox.stub().resolves(),
    unlock: this.sandbox.spy()
  };
  this.setProperty(window.screen, 'orientation', this.orientation);
  this.setProperty(window.screen, 'mozOrientation', undefined);
  this.setProperty(window.screen, 'msOrientation', undefined);
  this.setProperty(window, 'orientation', 0);
  this.fixture = document.getElementById('qunit-fixture');
  this.video = document.createElement('video');
  this.fixture.appendChild(this.video);
  this.player = videojs(this.video);
};

export const afterEach = function() {
  try {
    if (!this.player.isDisposed()) {
      this.player.dispose();
    }
  } finally {
    this.restoreProperties.reverse().forEach(restore => restore());
    this.sandbox.restore();
  }
};
