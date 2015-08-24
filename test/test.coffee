eloquent = require '../'
should = require 'should'

Error.stackTraceLimit = Infinity

describe 'AddSub', ->
  structure =
    _constructor: (n)-> @n = n
    add:
      _method: (n)-> @n += n
    inc:
      _getter: -> ++@n
    sub:
      _method: (n)-> @n -= n
    dec:
      _getter: -> --@n
    base:
      _method: (b)-> @n.toString b || 10
      _returns: yes
    util:
      double:
        _getter: -> @n *= 2

  AddSub = eloquent structure
  AddSub.noThrow = true # coffee-script returns by default

  it 'should have created the class', ->
    (should AddSub).be.ok().and.a.Function()

  it 'should create objects without `new`', ->
    (should AddSub 1).be.ok()
    (AddSub 42).n.should.equal 42

  it 'should not allow instantiation (via `new`)', ->
    (->
      new AddSub 42
    ).should.throw 'eloquent structures cannot be instantiated directly'

  it 'should have no-constructor functionality', ->
    (should (eloquent {})()).be.ok()

  it 'should have basic constructor functionality', ->
    (AddSub 1).n.should.equal 1

  it 'should add', ->
    n = AddSub 1
    (AddSub 1).add(15).n.should.equal 16
    (AddSub 1).add(15).add(84).n.should.equal 100

  it 'should subtract', ->
    n = AddSub 1
    (AddSub 1).sub(15).n.should.equal -14
    (AddSub 1).sub(15).sub(84).n.should.equal -98

  it 'should increment', ->
    (AddSub 0).inc.n.should.equal 1
    (AddSub 1).inc.inc.n.should.equal 3
    (AddSub 15).inc.inc.inc.n.should.equal 18

  it 'should decrement', ->
    (AddSub 15).dec.n.should.equal 14
    (AddSub 10).dec.dec.n.should.equal 8
    (AddSub 20).dec.dec.dec.n.should.equal 17

  it 'should add and subtract', ->
    (AddSub 0).inc.dec.inc.dec.n.should.equal 0
    (AddSub 5).add(15).dec.inc.n.should.equal 20
    (AddSub 10).inc.sub(10).dec.dec.n.should.equal -1
    (AddSub 15).add(15).sub(10).inc.inc.dec.n.should.equal 21

  it 'should honor _returns', ->
    (AddSub 16).base(16).should.equal '10'
    (AddSub 714).base(32).should.equal 'ma'
    (AddSub 34377).base(36).should.equal 'qix'
    (AddSub 5).base().should.equal '5'
    (should (AddSub 5).base().n).not.be.ok()

  it 'should honor namespaces', ->
    (AddSub 8).util.n.should.equal 8
    (AddSub 8).util.double.n.should.equal 16
    (AddSub 14).util.double.inc.add(4).n.should.equal 33

  it 'should not violate namespaces', ->
    (should (AddSub 1).util.add).not.be.ok()
    (should (AddSub 1).double).not.be.ok()

describe 'DynamicProp', ->
  wrapArray = (arr)->
    chain = {}
    (chain[v] = ((v)->-> @a.push v) v) for v in arr
    return chain
  structure =
    _constructor: (@arr)-> @a = []
    util:
      _alias: 'utility'
      _dynamic: yes
      _getter: -> wrapArray @arr

  DynamicProp = eloquent structure
  DynamicProp.noThrow = true # coffee-script returns by default

  structure.util._alias = ['utility']

  DynamicProp2 = eloquent structure
  DynamicProp2.noThrow = true # coffee-script returns by default

  it 'should gracefully handle empty dynamic chains', ->
    (should (DynamicProp []).util.util.util).be.ok()

  it 'should dynamically list properties', ->
    (should (DynamicProp ['foo']).util.foo).be.ok()
    (should (DynamicProp ['qux', 'qix']).util.qux).be.ok()
    (should (DynamicProp ['qux', 'qix']).util.qux.util.qix).be.ok()

  it 'should honor aliases (singular)', ->
    (should (DynamicProp2 ['foo']).util.foo).be.ok()
    (should (DynamicProp2 ['foo']).utility.foo).be.ok()

  it 'should honor aliases (array)', ->
    (should (DynamicProp ['foo']).util.foo).be.ok()
    (should (DynamicProp ['foo']).utility.foo).be.ok()
    (should (DynamicProp ['foo', 'bar']).utility.foo.util.bar).be.ok()

describe 'OwnThis', ->
  structure =
    _constructor: ->
      @foo = 1234
    add: _method: (n)-> @foo += n
    addTo: _method: (prop, n)-> @[prop] += n
    obj:
      _getter: -> @
      _returns: yes

  OwnThis = eloquent structure
  OwnThis.noThrow = true
  OwnThis.new = no

  it 'should use the this obj', ->
    o = {}
    (should (OwnThis o).obj).equal o

  it 'should pass existing state', ->
    o = bar: 1234
    (should (OwnThis o).obj.bar).equal 1234
    (should (OwnThis o).bar).equal 1234
    (should ((OwnThis o).add 10).obj.bar).equal 1234
    (should ((OwnThis o).add 10).bar).equal 1234
    (should ((OwnThis o).add 10).foo).equal 1244

describe 'Lighting', ->
  structure =
    _constructor: -> @level = 0
    lighter:
      _getter: -> @level += 1
      _method: (n)-> @level += Math.max 0, n - 1
    value:
      _getter: -> @level
      _setter: (@level)->
      _returns: yes

  Lighting = eloquent structure
  Lighting.noThrow = true

  it 'should increment', ->
    Lighting().value.should.equal 0
    Lighting().lighter.value.should.equal 1
    Lighting().lighter.lighter.value.should.equal 2

  it 'should adjust when method is called', ->
    Lighting().lighter(2).value.should.equal 2
    Lighting().lighter(2).lighter.value.should.equal 3
    Lighting().lighter(3).lighter.lighter(5).value.should.equal 9
    Lighting().lighter.lighter.lighter(3).lighter.lighter(2).lighter
      .lighter(15).lighter(10).lighter.lighter.lighter.value.should.equal 37

  it 'should set the value', ->
    l = Lighting()
    l.value.should.equal 0
    l.lighter.value.should.equal 1
    l.value.should.equal 1
    l.value = 15
    l.value.should.equal 15
    l.lighter.value.should.equal 16
    l.lighter.value = 50
    l.value.should.equal 50
    l.lighter(100).value = 150
    l.value.should.equal 150
