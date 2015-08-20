# Eloquent [![Travis-CI.org Build Status](https://img.shields.io/travis/Qix-/eloquent.svg?style=flat-square)](https://travis-ci.org/Qix-/eloquent) [![Coveralls.io Coverage Rating](https://img.shields.io/coveralls/Qix-/eloquent.svg?style=flat-square)](https://coveralls.io/r/Qix-/eloquent)
> Easily build up chaining structures

## Example

```coffeescript
var eloquent = require('eloquent');

var structure = {
	_constructor: function () { this.flag = false; },

	signal: {
		_getter: function () { this.flag = true; }
	},

	clear: {
		_getter: function () { this.flag = false; }
	},

	util: {
		signalIf: {
			_method: function (cond) {
				if (cond) {
					this.flag = true;
				}
			}
		}
	}

	emit: {
		_method: function () {
			if (this.flag) {
				console.log('Signal!');
			}
		}
	}
};

var Signaler = eloquent(structure);

Signaler().emit().signal.emit() // emits
	.clear.emit()
	.signal.clear.emit()
	.util.signalIf(5 > 1).emit(); // emits
// The above statement logs 'Signal!' twice.
```

## License
Licensed under the [MIT License](http://opensource.org/licenses/MIT).
You can find a copy of it in [LICENSE](LICENSE).
