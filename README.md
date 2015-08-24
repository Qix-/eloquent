# Eloquent [![Travis-CI.org Build Status](https://img.shields.io/travis/Qix-/eloquent.svg?style=flat-square)](https://travis-ci.org/Qix-/eloquent) [![Coveralls.io Coverage Rating](https://img.shields.io/coveralls/Qix-/eloquent.svg?style=flat-square)](https://coveralls.io/r/Qix-/eloquent)
> Easily build up chaining structures

## Example

```javascript
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
	},

	hasFlag: {
		_returns: true, /* the method should not be wrapped */
		_method: function () {
			return !!this.flag;
		}
	},

	status: {
		_returns: true, /* the getter should not be wrapped */
		_getter: function () {
			return !!this.flag;
		}
	},

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

console.log(Signaler().signal.hasFlag()); //-> true
console.log(Signaler().util.signalIf(true).status); //-> true
```

## To-Do
Some things that still need to be done

- [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)ing out the
  implementation
- Review/revise the underscore-prefix API (as suggested by
  [Sindre Sorhus](/sindresorhus))
- Add better ability to mix dynamic properties with non-dynamic properties
- Performance increases (static prototype buildup at creation of Eloquent
  structure, etc.)

## License
Licensed under the [MIT License](http://opensource.org/licenses/MIT).
You can find a copy of it in [LICENSE](LICENSE).
