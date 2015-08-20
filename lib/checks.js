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

	isMethod: function (chain) {
		return chain._method instanceof Function;
	},

	isNotGetter: function (chain) {
		if (module.exports.isGetter(chain)) {
			throw new Error('cannot define both _getter and _method');
		}
	},

	assertNoGetter: function (chain, prop) {
		if (chain[prop] !== undefined) {
			throw new Error('cannot specify ' + prop + ' without _getter or _method');
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
