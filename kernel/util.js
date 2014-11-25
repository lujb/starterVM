exports.$ = function(s) {
  return parseInt(s);
}

exports.assert = function(ok) {
  if (!ok) {
    throw('assert fail.')
  }
}