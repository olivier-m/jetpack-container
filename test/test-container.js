"use strict";

const {URL} = require("url");

const container = require("container");

let fixtures = URL("fixtures", module.uri).toString();

exports["test basic"] = function(assert) {
    let c = container.create()
    c.main();

    assert.pass();

    assert.equal("void", c.evaluate("(function() { return module.id })();"));

    assert.equal("void", c.evaluate(function() { return module.id; }));

    assert.throws(function() {
        c.evaluate("require('chrome');");
    });

    assert.throws(function() {
        c.evaluate("require('sdk/url');");
    });

    assert.throws(function() {
        c.evaluate(function() { fixtures[0]; });
    });
};

exports["test fixtures"] = function(assert) {
    let c = container.create(fixtures);
    assert.throws(c.main);
    assert.throws(function() {
        c.main("error");
    });

    c.main("main");

    assert.equal("m1", c.evaluate(function() { return m1.foo; }));
    assert.equal("m2", c.evaluate(function() { return m2.bar; }));
};

exports["test m1"] = function(assert) {
    let c = container.create(fixtures + "/m1");
    c.main("m1");

    c.main("m1bis");
    assert.equal("m1", c.evaluate(function() { return woot; }))

    assert.throws(function() {
        c.main("m2");
    });
};

exports["test options"] = function(assert) {
    let url = require("url");

    let c = container.create({
        modules: {
            "myURL": url
        },
        globals: {
            foo: "foo"
        }
    });

    c.main();

    c.evaluate(function() {
        require("myURL");
    });

    assert.pass();

    assert.equal("foo", c.evaluate(function() {
        return foo;
    }));
};

require("test").run(exports);
