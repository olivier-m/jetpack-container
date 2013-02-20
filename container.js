/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*
Modification of code comming from Test-Pilot Mozilla Extension
https://github.com/gregglind/git-testpilot/
*/
"use strict";
const {Cc,Ci,Cr,Cs,Cu, components} = require("chrome");

const self = require("self");
const {Loader, main, resolveURI, resolve, descriptor} = require('toolkit/loader');

const {mix} = require("sdk/core/heritage");
const file = require("sdk/io/file");
const {evaluate} = require("sdk/loader/sandbox")
const globals = require('sdk/system/globals');
const {URL, toFilename} = require("sdk/url");

const {validateOptions} = require('sdk/deprecated/api-utils');


const resolvePaths = function(paths) {
    return paths.filter(function(path) {
        try {
            if (path[0] !== "/") {
                let path = toFilename(path);
            }

            if (file.exists(path)) {
                return path;
            }
            throw new Error("File \"" + path + "\" does not exist.");
        } catch(e) {
            console.warn(e);
        }
    });
};

const searchFile = function(name, paths) {
    let path;
    if (name.substr(-3) !== ".js") {
        name += ".js";
    }
    for (let i=0; i<paths.length; i++) {
        path = file.join(paths[i], name);
        if (file.exists(path)) {
            return path;
        };
    }
};

const modLoader = function(root, options){
    let requirements = {
        'modules': {
            map: function(val) typeof(val) === "object" && val || {}
        },
        'globals': {
            map: function(val) typeof(val) === "object" && val || {}
        },
        'override_paths': {
            map: function(val) typeof(val) === "object" && val || []
        },
        'search_path': {
            map: function(val) Array.isArray(val) && resolvePaths(val) || []
        }
    };
    options = validateOptions(options, requirements);

    let mods = options.modules;

    let loader = Loader({
        modules: mods,
        globals:mix(options.globals, {
            ALLOWED: Object.keys(mods),
            ADDONID: self.id,
            ADDONPREFPREFIX: 'extensions.' + self.id + "."
        }),
        paths: mix({
                "": root,
                '/': 'file:///',
            },
            options.override_paths
        ),
        resolve: function(id, requirer) {
            if (id == "chrome") {
                throw new Error("You are not allowed not load chrome in container.");
            }
            if (id in mods) {
                return id;
            }

            if (id.indexOf("./") === 0) {
                // A bit awkward
                return resolve(file.join(file.dirname(requirer), id.substr(2)), "");
            }

            // required id could be in search path
            let path = searchFile(id, options.search_path);
            if (path) {
                return resolve(path, "");
            }

            return id in mods ? id : resolve(id, requirer);
        }
    });

    // Override globals to make `console` available, from gozala/scratch-kit:core.js
    Object.defineProperties(loader.globals, descriptor(globals));

    return loader
};


const newContainer = function(root, options) {
    let mainURI = null;
    let sandbox = null;

    if (arguments.length == 1) {
        if (typeof(root) === "string") {
            options = {};
        } else {
            // We assume root is options
            options = root;
            root = undefined;
        }
    }

    // Define root to data/modules if not defined
    if (root === null || typeof(root) === "undefined") {
        // Default root to this package data directory
        root = URL('../data/', module.uri).toString();
    } else if (root[0] == "/") {
        root = "file://" + root;
    }
    if (root.substr(-1) !== "/") {
        root += "/";
    }

    let loader = modLoader(root, options);

    return {
        main: function(mainFile) {
            mainFile = mainFile || 'void';

            mainURI = resolveURI(mainFile, loader.mapping);
            main(loader, mainFile);
            sandbox = loader.sandboxes[mainURI];
        },
        evaluate: function(code) {
            if (sandbox === null) {
                throw new Error("No sandbox for evaluate.");
            }
            if (typeof(code) === "string") {
                return evaluate(sandbox, code);
            }
            if (typeof(code) === "function") {
                let args = JSON.stringify(Array.prototype.slice.call(arguments).slice(1));
                code = "(" + code.toSource() + ").apply(null, " + args + ")";
                return evaluate(sandbox, code);
            }
        },
        get loader() {
            return loader;
        },
        get sandbox() {
            return sandbox;
        },
        get uri() {
            return mainURI;
        }
    };
};
exports.create = newContainer;

const processException = function(e) {
    if (typeof(e) === "object" && "stack" in e) {
        console.exception(e);
    } else {
        console.error("An exception occured.", e);
    }
};
exports.processException = processException;
