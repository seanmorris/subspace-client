"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Channel = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Channel = function () {
  function Channel() {
    _classCallCheck(this, Channel);
  }

  _createClass(Channel, null, [{
    key: "scalar",
    value: function scalar(data, type) {
      var buffer = new Uint8Array(data).buffer;

      if (type == 'float') {
        return new Float64Array(buffer)[0];
      } else if (type == 'Int32') {
        return new Int32Array(buffer)[0];
      }
    }
  }, {
    key: "namePart",
    value: function namePart(name, part) {
      return name.split(':')[part] || null;
    }
  }, {
    key: "isWildcard",
    value: function isWildcard(name) {
      return /\*/.exec(name);
    }
  }, {
    key: "isRange",
    value: function isRange(name) {}
  }, {
    key: "containsRange",
    value: function containsRange(name) {}
  }, {
    key: "compareNames",
    value: function compareNames(a, b) {
      var rangeForm = /^(\d+)\-?(\d+)?$/;
      var result = [];
      var splitA = a.toString().split(':');
      var splitB = b.toString().split(':');
      var nodes = splitA.length;
      var cmpA;
      var cmpB;

      if (nodes < splitB.length) {
        nodes = splitB.length;
      }

      for (var i = 0; i < nodes; i++) {
        if (splitA.length > i) {
          cmpA = splitA[i];
        } else if (splitA[splitA.length - 1] == '*') {
          cmpA = splitA[splitA.length - 1];
        } else {
          return false;
        }

        if (splitB.length > i) {
          cmpB = splitB[i];
        } else if (splitB[splitB.length - 1] == '*') {
          cmpB = splitB[splitB.length - 1];
        } else {
          return false;
        }

        var returnNode = cmpA !== '*' ? cmpA : cmpB;

        if (cmpA !== cmpB) {
          if (cmpA !== '*' && cmpB !== '*') {
            var mA = rangeForm.exec(cmpA);
            var mB = rangeForm.exec(cmpB);

            if (mA && mB) {
              var a1 = mA[1];
              var a2 = mA[1];
              var b1 = mB[1];
              var b2 = mB[1];

              if (mA[2]) {
                a2 = mA[2];
              }

              if (mB[2]) {
                b2 = mB[2];
              }

              if (a1 >= b1 && a2 <= b2) {
                returnNode = "".concat(a1, "-").concat(a2);
              } else if (a1 <= b1 && a2 > b2) {
                returnNode = "".concat(b1, "-").concat(b2);
              } else if (a2 <= b2 && a2 >= b1) {
                returnNode = "".concat(b1, "-").concat(a2);
              } else if (a1 <= b2 && a1 >= b1) {
                returnNode = "".concat(a1, "-").concat(b2);
              }

              if (b2 <= a2 && b2 >= a1) {
                returnNode = "".concat(a1, "-").concat(b2);
              } else if (b1 <= a2 && b1 >= a1) {
                returnNode = "".concat(b1, "-").concat(a2);
              } else {
                return false;
              }
            } else {
              return false;
            }
          }
        }

        result.push(returnNode);
      }

      return result.join(':');
    }
  }]);

  return Channel;
}();

exports.Channel = Channel;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Socket = void 0;

var _Channel = require("./Channel");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Socket = function () {
  _createClass(Socket, null, [{
    key: "get",
    value: function get(url) {
      var refresh = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (!this.sockets) {
        this.sockets = {};
      }

      if (refresh || !this.sockets[url]) {
        this.sockets[url] = new this(new WebSocket(url));
      }

      return this.sockets[url];
    }
  }]);

  function Socket(socket) {
    _classCallCheck(this, Socket);

    this.socket = socket;
    socket.binaryType = 'arraybuffer';
    this.data = {};
    this.listenerCount = {};
    this.openQueue = [];
    this._onSend = [];
  }

  _createClass(Socket, [{
    key: "subscribe",
    value: function subscribe(type, wildType, callback) {
      var splitType = type.split(':');
      var mainType = splitType.shift();
      var channel = splitType.join(':');

      if (wildType instanceof Function) {
        callback = wildType;
        wildType = channel;
      }

      if (channel) {
        if (!(channel in this.listenerCount)) {
          this.listenerCount[channel] = 0;
        }

        this.listenerCount[channel]++;
        this.send("sub ".concat(channel));
      }

      var finalCallback = function (mainType, wildType, channel, callback) {
        return function (event) {
          var packet = {};

          try {
            if (typeof event.data == 'string') {
              packet = JSON.parse(event.data);
            } else if (event.data instanceof ArrayBuffer) {
              var channelNumber = new Uint16Array(event.data, 4, 1)[0];

              if (!wildType || _Channel.Channel.compareNames(wildType, channelNumber)) {
                callback(event, event.data.slice(6), channelNumber, new Uint16Array(event.data, 0, 1)[0] ? 'user' : 'server', new Uint16Array(event.data, 2, 1)[0], null, {});
                return;
              }
            } else if (mainType !== 'message') {
              callback(event);
              return;
            }
          } catch (e) {
            if (mainType !== 'message') {
              callback(event);
            }

            return;
          }

          if (_typeof(packet) !== 'object') {
            if (channel === '') {
              callback(event, event.data, null, 'server', 0, null, packet);
            }

            return;
          }

          if (!wildType) {
            callback(event, packet.message, null, packet.origin, packet.originId, null, packet);
          }

          if (wildType && 'channel' in packet) {
            if (_Channel.Channel.compareNames(wildType, packet.channel)) {
              callback(event, packet.message, packet.channel, packet.origin, packet.originId, packet.originalChannel, packet);
            }
          }
        };
      }(mainType, wildType, channel, callback);

      this.socket.addEventListener(mainType, finalCallback);
      return finalCallback;
    }
  }, {
    key: "unsubscribe",
    value: function unsubscribe(type, callback) {
      var splitType = type.split(':');
      var mainType = splitType.shift();
      var channel = splitType.join(':');

      if (!channel) {
        return;
      }

      this.listenerCount[channel]--;

      if (channel in this.listenerCount && this.listenerCount[channel] > 0) {} else {
        this.socket.removeEventListener(mainType, callback);
        this.send("unsub ".concat(channel));
      }
    }
  }, {
    key: "publish",
    value: function publish(channel, message) {
      if (channel == parseInt(channel)) {
        if (message instanceof ArrayBuffer) {
          message = new Uint8Array(message);
        } else if (message.byteLength) {
          message = new Uint8Array(message.buffer);
        } else if (!Array.isArray(message)) {
          message = [message];
        }

        var channelBytes = new Uint8Array(new Uint16Array([channel]).buffer);
        var sendBuffer = new Uint8Array(channelBytes.byteLength + message.byteLength);
        sendBuffer.set(channelBytes, 0);
        sendBuffer.set(message, channelBytes.byteLength);
        this.send(sendBuffer);
        return;
      }

      this.send("pub ".concat(channel, " ").concat(message));
    }
  }, {
    key: "send",
    value: function send(message) {
      var _this = this;

      if (this.socket.readyState !== this.socket.OPEN) {
        return new Promise(function (accept, reject) {
          var connectionOpened = function (c) {
            return function (event) {
              while (_this.openQueue.length) {
                var _message = _this.openQueue.shift();

                _this.send(_message);
              }

              _this.socket.removeEventListener('open', c);

              accept();
            };
          }(connectionOpened);

          _this.socket.addEventListener('open', connectionOpened);

          _this.openQueue.unshift(message);
        });
      }

      for (var i in this._onSend) {
        this._onSend[i](message);
      }

      this.socket.send(message);
      return Promise.resolve();
    }
  }, {
    key: "onSend",
    value: function onSend(callback) {
      this._onSend.push(callback);
    }
  }, {
    key: "close",
    value: function close(message) {
      this.socket.close();
    }
  }, {
    key: "ping",
    value: function ping() {}
  }, {
    key: "pong",
    value: function pong() {}
  }]);

  return Socket;
}();

exports.Socket = Socket;
