'use strict';

var cloneDeep = require('clone-deep');
var cloneObject = require('clone-object');

function assertNoReturn(obj, chain, type, val) {
	if (!obj.constructor.noThrow && !chain._returns && !chain._dynamic &&
			val !== undefined) {
		throw new Error(type + ' returned a value');
	}

	return val;
}

function applyGetter(obj, root, chain, type, args) {
	var res = assertNoReturn(obj, chain, type,
			chain['_' + type].apply(obj, args));

	if (chain._returns) {
		return res;
	}

	var newChain = chain;
	if (chain._dynamic) {
		newChain = res;
	}

	return applyPrototype(obj, newChain, root);
}

function resolveGetter(obj, root, chain) {
	if (chain._method instanceof Function) {
		if (chain._getter instanceof Function) {
			throw new Error('cannot define both _getter and _method');
		}

		if (chain._dynamic && chain._returns !== undefined) {
			throw new Error('cannot define _returns if _dynamic is true');
		}

		return function () {
			return function () {
				return applyGetter(obj, root, chain, 'method', arguments);
			};
		};
	} else if (chain._getter instanceof Function) {
		if (chain._dynamic && chain._returns !== undefined) {
			throw new Error('cannot define _returns if _dynamic is true');
		}

		return function () {
			return applyGetter(obj, root, chain, 'getter');
		};
	}

	if (chain._returns !== undefined) {
		throw new Error('cannot specify _returns without _getter or _method');
	}

	if (chain._dynamic !== undefined) {
		throw new Error('cannot specify _dynamic without _getter or _method');
	}

	return function () {
		return applyPrototype(obj, chain, root);
	};
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

		var getter = resolveGetter(obj, root, structure[k]);

		Object.defineProperty(dummy, k, {
			enumerable: true,
			get: getter
		});
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
