'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Channel = exports.Channel = function () {
	function Channel() {
		_classCallCheck(this, Channel);
	}

	_createClass(Channel, null, [{
		key: 'scalar',
		value: function scalar(data, type) {
			var buffer = new Uint8Array(data).buffer;

			if (type == 'float') {
				return new Float64Array(buffer)[0];
			} else if (type == 'Int32') {
				return new Int32Array(buffer)[0];
			}
		}
	}, {
		key: 'namePart',
		value: function namePart(name, part) {
			return name.split(':')[part] || null;
		}
	}, {
		key: 'isWildcard',
		value: function isWildcard(name) {
			return (/\*/.exec(name)
			);
		}
	}, {
		key: 'isRange',
		value: function isRange(name) {
			// return /\*/.exec(name);
		}
	}, {
		key: 'containsRange',
		value: function containsRange(name) {
			// return /\*/.exec(name);
		}
	}, {
		key: 'compareNames',
		value: function compareNames(a, b) {
			var rangeForm = /^(\d+)\-?(\d+)?$/;

			var result = [];
			var splitA = a.toString().split(':');
			var splitB = b.toString().split(':');
			var nodes = splitA.length;
			var cmpA = void 0;
			var cmpB = void 0;

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
								returnNode = a1 + '-' + a2;
							} else if (a1 <= b1 && a2 > b2) {
								returnNode = b1 + '-' + b2;
							} else if (a2 <= b2 && a2 >= b1) {
								returnNode = b1 + '-' + a2;
							} else if (a1 <= b2 && a1 >= b1) {
								returnNode = a1 + '-' + b2;
							}
							if (b2 <= a2 && b2 >= a1) {
								returnNode = a1 + '-' + b2;
							} else if (b1 <= a2 && b1 >= a1) {
								returnNode = b1 + '-' + a2;
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