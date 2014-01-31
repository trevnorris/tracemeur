var fs = require('fs');
// Grab these in case a user decides to use tracemeur on them.
var openSync = fs.openSync;
var closeSync = fs.closeSync;
var writeSync = fs.writeSync;

// The minimum number of times a stack trace has to be hit before it's printed.
var minimum_hits = 200;
// Default output is stdout.
var output = 'stdout';
// fd for stdout is 1.
var print_fd = 1;
// If it's a path should we overwrite it?
var overwrite_fd = true;
// By default let's just grab all the lines.
var trace_limit = Infinity;

// Grab the line delimiter by system.
var nl = process.platform === 'win32' ? '\r\n' : '\n';

var calls_list = {};
var traces_list = {};

module.exports = tracemeur;

process.on('SIGINT', ender);
process.on('exit', ender);


// name should look like "dns." or "TCP#"
// object should be require('dns') or process.binding('tcp_wrap').TCP.prototype
// method is optional, is name of method
// Example usage:
//    tracemeur('dns.', require('dns'), 'lookup');
function tracemeur(name, object, fnstring) {
  if (typeof fnstring === 'string') {
    calls_list[name+fnstring] = 0;
    object[fnstring] = (function(call) {
      var old_fn = object[call];
      return function() {
        perfStat(name, call);
        return old_fn.apply(this, arguments);
      }
    }(fnstring));
    return;
  }

  for (var i in object) {
    if (typeof object[i] !== 'function')
      continue;
    calls_list[name+i] = 0;
    object[i] = (function(call) {
      var old_fn = object[call];
      return function() {
        perfStat(name, call);
        return old_fn.apply(this, arguments);
      }
    }(i));
  }
}


// Set the output.
// out takes the following three arguments:
//   - 'stdout' (default) Print to stdout.
//   - 'stderr' Print to stderr.
//   - {String} Path to file.
// append is optional and only does anything if a path is passed. Tells
// tracemeur to append to the file if it exists.
tracemeur.setOutput = function setOutput(out, append) {
  if (typeof out !== 'string')
    throw new TypeError('out should always be a string');
  output = out;
  if (typeof append === 'boolean')
    overwrite_fd = !append;
};


// Set the minimum number of times a stack trace needs to have been called
// before it's printed (default 200).
tracemeur.setMinimumCalls = function setMinimumCalls(n) {
  minimum_hits = n >>> 0;
};


// Set the stack trace limit when capturing (default Infinity).
tracemeur.setTraceDepth = function setTraceDepth(n) {
  if (n === Infinity)
    trace_limit = n;
  else
    trace_limit = n >>> 0;
};


function perfStat(name, call) {
  // Simple counter for calls.
  calls_list[name+call]++;
  var current_limit = Error.stackTraceLimit;
  Error.stackTraceLimit = trace_limit;

  // Going to really slow down our process. But counts are more imporant.
  var obj = {};
  Error.captureStackTrace(obj, perfStat);
  var trace = obj.stack.substr(6);
  if (!traces_list[trace])
    traces_list[trace] = 0;
  traces_list[trace]++;

  Error.stackTraceLimit = current_limit;
}

function ender() {
  var sortable = [];
  var has_stuff = false;
  var i;

  // First check if we have any stuff in our storage.
  for (i in calls_list) {
    has_stuff = true;
    break;
  }

  if (!has_stuff)
    return;

  prepOutput();

  print('tracemeur output' + nl);
  print('----------------' + nl + nl);

  print('Call totals:' + nl + nl);
  for (i in calls_list) {
    print(i + ': ' + calls_list[i] + nl);
  }
  print(nl + nl);

  for (i in traces_list) {
    if (traces_list[i] > minimum_hits)
      sortable.push([i, traces_list[i]]);
  }

  if (sortable.length === 0)
    return closeOutput();

  sortable.sort(function(a,b) { return b[1] - a[1]; });

  print('Trace output:' + nl + nl);
  for (i = 0; i < sortable.length; i++) {
    print('calls: ' + sortable[i][1] + nl)
    print('' + sortable[i][0] + nl + nl);
  }

  closeOutput();
}


function prepOutput() {
  if (output === 'stderr')
    print_fd = 2;
  if (output === 'stdout')
    return;

  // We assume output is to a path. So setup the fd.
  if (overwrite_fd)
    print_fd = openSync(output, 'w');
  else
    print_fd = openSync(output, 'a');
}


function closeOutput() {
  closeSync(print_fd);
}


function print(line) {
  writeSync(print_fd, line);
}
