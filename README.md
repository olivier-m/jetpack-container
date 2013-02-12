Jetpack Container
=================

Jetpack Container is a Mozilla Addon-SDK package that allows you to create a container that provides its own `require()` function based on some settings you gave on creation.

You usualy don't need such a package but who knows ;)


Usage
-----

### container.create([[root,] options])

This function creates a new "container". If provided, `root` is the first path to search for main module and other.

`option` is an object taking the following options:

 * `modules`: key/value object of available modules in container.
 * `globals`: key/value of global objects exposed to container.
 * `override_paths`: paths definitions pushed to container loader.
 * `search_path`: list of paths where `require()` resolver should look for modules.

Returned object contains the following properties:

 * `loader`: Loader instance
 * `sandbox`: Sandbox instance
 * `uri`: main module URI
 * `main(moduleName)`: Starts container using `moduleName`. If `moduleName` is not provided, an empty script would be loaded.
 * `evaluate(code)`: Evaluates some code in container. `code` could be a a string or a function.

