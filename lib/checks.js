'use strict';

module.exports = {
	dynamicReturns: function (chain) {
		if (chain._dynamic && chain._returns !== undefined) {
			throw new Error('cannot define _returns if _dynamic is true');
		}
	},

	isGetter: function (chain) {
		return chain._getter instanceof Function;
	},

	isSetter: function (chain) {
		return chain._setter instanceof Function;
	},

	isMethod: function (chain) {
		return chain._method instanceof Function;
	},

	assertNoGetter: function (chain, prop) {
		if (chain[prop] !== undefined) {
			throw new Error('cannot specify ' + prop + ' without _getter or _method');
		}
	},

	assertNotHybrid: function (hybrid, what) {
		if (hybrid) {
			throw new Error('cannot ' + what + ' if both _method and _getter are ' +
					'specified');
		}
	},

	assertNoReturn: function (obj, chain, type, val) {
		if (!obj.constructor.noThrow && !chain._returns && !chain._dynamic &&
				val !== undefined) {
			throw new Error(type + ' returned a value');
		}

		return val;
	}
};
