tracemeur
=========

A quick and dirty way to punch methods and keep stack trace counts on how many
times something is executed. This can drastically hurt your application's
performance and is a utility to help you keep track of how many times something
is called and where those calls originated. It's only meant as a way to quickly
identify a few methods. If you wish to see more complete stack traces across the
application then learn how to use something like DTrace.

Install simply:
```
$ npm install tracemeur
```

Example usage:
```javascript
var dns = require('dns');
var tracemeur = require('tracemeur');

tracemeur('dns.', dns, 'lookup');

// Do your thing
```

Methods
-------

**tracemeur(name, object[, method])**: Main function to punch methods. Arguments
are as follows:

`name`: Name of the object. This is directly appended to the name of the
method being called so please add a `.` or `#` depending on whether you're
punching a function or prototype method (e.g. `Server#`).

`object`: Object that contains the methods. By default it will loop through
and punch all methods on the object.

`method`: Optional. Name a specific method to punch.

**tracemeur.setMinimumCalls(n)**: Set the minimum number of calls to a specific
stack trace before it's printed out.

**tracemeur.setTraceDepth(n)**: Set the depth of the stack trace. Default is to
capture all lines.

**tracemeur.setOutput(out[, append])**: Set the output. Arguments are as follows:

`out`: How/Where to output. The user can pass `'stdout'` (default),
`'stderr'`, or pass a path where a file will be written.

`append`: If a path is passed to `out` and you wish to append to the file then
pass `true` as the second argument.

Output
------

Output will look like so when things print:
```
tracemeur output
----------------

Call totals:

b.test: 1000


Trace output:

calls: 1000
    at Object.test (/var/projects/tracemeur/tracemeur.js:41:9)
    at level3 (/var/projects/tracemeur/example.js:11:9)
    at level2 (/var/projects/tracemeur/example.js:12:6)
    at level1 (/var/projects/tracemeur/example.js:13:4)
    at Object.<anonymous> (/var/projects/tracemeur/example.js:14:2)
    at Module._compile (module.js:449:26)
    at Object.Module._extensions..js (module.js:467:10)
    at Module.load (module.js:349:32)
    at Function.Module._load (module.js:305:12)
    at Function.Module.runMain (module.js:490:10)
```
