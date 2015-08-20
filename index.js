'use strict';

var cloneDeep = require('clone-deep');
var cloneObject = require('clone-object');
var check = require('./lib/checks.js');

function applyGetter(obj, root, chain, type, args) {
	var res = check.assertNoReturn(obj, chain, type,
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
	if (check.isMethod(chain)) {
		check.isNotGetter(chain);
		check.dynamicReturns(chain);

		return function () {
			return function () {
				return applyGetter(obj, root, chain, 'method', arguments);
			};
		};
	} else if (check.isGetter(chain)) {
		check.dynamicReturns(chain);

		return function () {
			return applyGetter(obj, root, chain, 'getter');
		};
	}

	check.assertNoGetter(chain, '_returns');
	check.assertNoGetter(chain, '_dynamic');

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
