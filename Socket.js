'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Socket = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Channel = require('./Channel');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Socket = exports.Socket = function () {
	_createClass(Socket, null, [{
		key: 'get',
		value: function get(url) {
			var refresh = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			if (!this.sockets) {
				this.sockets = {};
			}

			if (1 || refresh || !this.sockets[url]) {
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
		key: 'subscribe',
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

				this.send('sub ' + channel);
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

					if ((typeof packet === 'undefined' ? 'undefined' : _typeof(packet)) !== 'object') {
						callback(event, event.data, null, 'server', 0, null, packet);
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
		key: 'unsubscribe',
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
				this.send('unsub ' + channel);
			}
		}
	}, {
		key: 'publish',
		value: function publish(channel, message) {
			if (channel == parseInt(channel)) {

				if (message.byteLength) {
					message = new Uint8Array(message.buffer);
				} else if (!Array.isArray(message)) {
					message = [message];
				}

				var channelBytes = new Uint8Array(new Uint16Array([channel]).buffer);

				var bytes = [];

				for (var i in channelBytes) {
					bytes[i] = channelBytes[i];
				}

				for (var _i = 0; _i < message.length; _i++) {
					bytes[_i + 2] = message[_i];
				}

				this.send(new Uint8Array(bytes));

				return;
			}

			this.send('pub ' + channel + ' ' + message);
		}
	}, {
		key: 'send',
		value: function send(message) {
			var _this = this;

			if (this.socket.readyState !== this.socket.OPEN) {
				return new Promise(function (accept, reject) {
					var connectionOpened = function (c) {
						return function (event) {
							var _loop = function _loop() {
								var message = _this.openQueue.shift();

								setTimeout(function () {
									_this.send(message);
								}, 100 * (_this.openQueue.length + 1));
							};

							while (_this.openQueue.length) {
								_loop();
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
		key: 'onSend',
		value: function onSend(callback) {
			this._onSend.push(callback);
		}
	}, {
		key: 'close',
		value: function close(message) {
			this.socket.close();
		}
	}, {
		key: 'ping',
		value: function ping() {
			// this.socket.ping();
		}
	}, {
		key: 'pong',
		value: function pong() {
			// this.socket.pong();
		}
	}]);

	return Socket;
}();