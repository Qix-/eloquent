'use strict';

var cloneDeep = require('clone-deep');
var cloneObject = require('clone-object');

function assertNoReturn(obj, chain, type, val) {
	if (!obj.constructor.noThrow && !chain._returns &&
			val !== undefined) {
		throw new Error(type + ' returned a value');
	}

	return val;
}

function applyPrototype(obj, structure, root) {
	if (!structure) {
		return obj;
	}
	root = root === undefined ? structure : root;
	var dummy = cloneObject(obj);

	var found = false;
	for (var k in structure) {
		if (!structure.hasOwnProperty(k) || k[0] === '_') {
			continue;
		}

		found = true;
		root = root || structure;

		(function (k, chain) {
			var getter;
			if (chain._method instanceof Function) {
				if (chain._getter instanceof Function) {
					throw new Error('cannot define both _getter and _method: ' + k);
				}

				getter = function () {
					return function () {
						var res = assertNoReturn(obj, chain, 'method',
								chain._method.apply(obj, arguments));

						if (chain._returns) {
							return res;
						}

						return applyPrototype(obj, chain, root);
					};
				};
			} else if (chain._getter instanceof Function) {
				getter = function () {
					var res = assertNoReturn(obj, chain, 'getter',
							chain._getter.call(obj));

					if (chain._returns) {
						return res;
					}

					return applyPrototype(obj, chain, root);
				};
			} else {
				if (chain._returns !== undefined) {
					throw new Error('cannot specify _returns without _getter or _method');
				}

				getter = function () {
					return applyPrototype(obj, chain, root);
				};
			}

			Object.defineProperty(dummy, k, {
				enumerable: true,
				get: getter
			});
		})(k, structure[k]);
	}

	return found ? dummy : applyPrototype(obj, root, null);
}

module.exports = function eloquent(structure) {
	structure = cloneDeep(structure);

	var constructor = function () {
		if (this) {
			throw new Error('eloquent structures cannot be instantiated directly');
		}
		var obj = {constructor: constructor};
		if (structure._constructor instanceof Function) {
			structure._constructor.apply(obj, arguments);
		}
		return applyPrototype(obj, structure);
	};

	return constructor;
};
