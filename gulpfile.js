var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var asm = require('./asm');
var $ = require('shelljs');

gulp.task('make', function() {
  $.exec('pegjs asm/grammar/asm.pegjs asm/asm.js');
});

gulp.task('test', function() {
  var asmDir = 'asm/test/asm/';
  var outDir = 'asm/test/out/';
  fs.readdir(asmDir, function(err, files) {
    files.forEach(function(f) {
      var out = outDir + f.split('.')[0] + '.out';
      var outBin = fs.readFileSync(out);
      asm.compile(fs.readFileSync(asmDir + f, 'utf8'), function(err, bin) {
        if (err) {
          console.log('test ' + asmDir + f + ' .. Failed');
          if (err.line && err.column && err.message) {
            err = 'line ' + err.line + ', column ' + err.column + ': ' + err.message;
          }
          throw(err);
        } else {
          if (bin.length !== outBin.length) {
            console.log('test ' + asmDir + f + ' .. Failed');
            throw('Bad object file generated')
          }

          for (var i=0; i<bin.length; i++) {
            if (bin[i] !== outBin[i]) {
              console.log('test ' + asmDir + f + ' .. Failed');
              throw('Bad object file generated')
            }
          }

          console.log('test ' + asmDir + f + ' .. OK');
        }
      });
    });
  });
});

gulp.task('dist', function() {
  $.exec('node web/tools/r.js -convert asm/ web/www/lib/asm');
  $.exec('node web/tools/r.js -convert kernel/ web/www/lib/kernel');
});

