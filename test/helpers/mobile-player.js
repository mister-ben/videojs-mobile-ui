import document from 'global/document';
import window from 'global/window';
import sinon from 'sinon';
import videojs from 'video.js';

export const setPlatform = function(platform) {
  this.browser.IS_IOS = platform === 'ios';
  this.browser.IS_ANDROID = platform === 'android';
};

export const beforeEach = function() {
  this.restoreProperties = [];
  this.sandbox = sinon.createSandbox();
  this.clock = this.sandbox.useFakeTimers();
  // Video.js freezes its browser flags; replace the container, not its fields.
  this.browser = {...videojs.browser, IS_IOS: false, IS_ANDROID: true};
  this.sandbox.stub(videojs, 'browser').value(this.browser);
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
    if (this.player && !this.player.isDisposed()) {
      this.player.dispose();
    }
  } finally {
    try {
      this.restoreProperties.reverse().forEach(restore => restore());
    } finally {
      this.sandbox.restore();
    }
  }
};
