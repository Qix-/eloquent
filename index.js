'use strict';

var cloneDeep = require('clone-deep');
var cloneObject = require('clone-object');
var check = require('./lib/checks.js');

function applyGetter(obj, root, chain, type, args) {
	check.dynamicReturns(chain);

	var res = check.assertNoReturn(obj, chain, type,
			chain['_' + type].apply(obj, args));

	var isHybrid = check.isMethod(chain) && check.isGetter(chain);

	if (chain._returns) {
		check.assertNotHybrid(isHybrid, 'specify _returns');
		return res;
	}

	var newChain = chain;
	if (chain._dynamic) {
		check.assertNotHybrid(isHybrid, 'be _dynamic');
		newChain = res || newChain;
	}

	var dummy = null;
	if (isHybrid) {
		dummy = function () {
			return applyGetter(obj, root, chain, 'method', arguments);
		};
	}

	return applyPrototype(obj, newChain, root, dummy);
}

function applySetter(obj, root, chain, v) {
	check.dynamicReturns(chain);

	var res = check.assertNoReturn(obj, chain, 'setter',
			chain._setter.call(obj, v));

	if (chain._returns) {
		return res;
	}

	var newChain = chain;
	if (chain._dynamic) {
		newChain = res || newChain;
	}

	return applyPrototype(obj, newChain, root);
}

function resolveGetter(obj, root, chain) {
	if (check.isGetter(chain)) {
		return function () {
			return applyGetter(obj, root, chain, 'getter');
		};
	} else if (check.isMethod(chain)) {
		return function () {
			return function () {
				return applyGetter(obj, root, chain, 'method', arguments);
			};
		};
	}

	check.assertNoGetter(chain, '_returns');
	check.assertNoGetter(chain, '_dynamic');

	return function () {
		return applyPrototype(obj, chain, root);
	};
}

function resolveSetter(obj, root, chain) {
	if (check.isSetter(chain)) {
		return function (v) {
			return applySetter(obj, root, chain, v);
		};
	}

	return undefined;
}

function applyPrototype(obj, structure, root, dummySrc) {
	if (!structure) {
		return obj;
	}
	root = root === undefined ? structure : root;
	var dummy = dummySrc || cloneObject(obj);

	var found = false;
	for (var k in structure) {
		if (!structure.hasOwnProperty(k) || k[0] === '_') {
			continue;
		}

		var chain = structure[k];

		found = true;
		root = root || structure;

		var getter = resolveGetter(obj, root, structure[k]);
		var setter = resolveSetter(obj, root, structure[k]);

		var names = chain._alias
			? Array.isArray(chain._alias)
				? chain._alias.slice()
				: [chain._alias]
			: [];

		names.unshift(k);

		for (var i = 0, len = names.length; i < len; i++) {
			Object.defineProperty(dummy, names[i], {
				enumerable: true,
				get: getter,
				set: setter
			});
		}
	}

	return found ? dummy : applyPrototype(obj, root, null, dummySrc);
}

module.exports = function eloquent(structure) {
	structure = cloneDeep(structure);

	var constructor = function () {
		if (this) {
			throw new Error('eloquent structures cannot be instantiated directly');
		}

		var args = [].slice.call(arguments);
		var obj = {};

		if (constructor.new === false) {
			obj = args.shift();
		}

		Object.defineProperty(obj, 'constructor', {
			configurable: true,
			writable: true,
			value: constructor
		});

		if (structure._constructor instanceof Function) {
			structure._constructor.apply(obj, args);
		}

		return applyPrototype(obj, structure);
	};

	return constructor;
};
