(function () {
  'use strict';

  var requirejs = require('requirejs');

  var fs = require('fs');
  
  var fsExtra = require('fs-extra');
  
  var UglifyJS = require('uglify-js');
  
  var buildDirectory = __dirname + '/build';
  
  var sourcesDirectory = __dirname + '/scripts';
  
  var dontOptimizeWithRequire = ['run'];

  function onDirRecurseAbsolute(dir, doWithFile, initDir) {
    var visitedDir = {};
    
    if (initDir === undefined) {
      initDir = dir;
    }

    fs.readdir(dir, function (err, files) {
      if (err !== null) {

      } else {
        files.forEach(function (file) {
          var filepath = dir + '/' + file;
          fs.stat(filepath, function (err, result) {
            if (err !== null) {
              console.log(err);
            } else {
              if (result.isDirectory()) {
                fs.realpath(filepath, function (err, realpath) {
                  if (err !== null) {
                    console.log(err);
                  } else {
                    //Preventing infinite loop with symlinks

                    if (visitedDir[realpath] === undefined) {
                      visitedDir[realpath] = true;
                      onDirRecurseAbsolute(filepath, doWithFile, initDir);
                    }
                  }
                });
              } else {
                doWithFile(filepath, initDir);
              }
            }
          });
        });
      }
    });
  }
  
  
  
  function onDirRecurseRelative(dir, doWithFile, initDir) {
    onDirRecurseAbsolute(dir, function (filepath, initDir) {
      var relativePath = filepath.substr(initDir.length + 1);
      doWithFile(relativePath);
    }, initDir);
  }

  onDirRecurseRelative(sourcesDirectory, function (relativeFilePath) {
    var moduleName = relativeFilePath.substr(0, relativeFilePath.length - 3);
    var out = buildDirectory + '/' + moduleName + '.js';
    
    if (dontOptimizeWithRequire.indexOf(moduleName) === -1) {
      requirejs.optimize({
        baseUrl: sourcesDirectory,
        name: moduleName,
        out: out,
      }, function (buildResponse) {
      }, function(err) {
          console.log(err);
      });
    } else {
      fsExtra.copy(sourcesDirectory + '/' + relativeFilePath, out, function (err) {
        if (err !== null) {
          console.log(err);
        }
      });
    }
  });
  
  console.log(fsExtra.remove);
  
  fsExtra.remove(buildDirectory, function (err) {
    if (err !== null) {
      console.log(err);
    } else {
//      onDirRecurseAbsolute(buildDirectory, function (file) {
//        var result = UglifyJS.minify(file);
//
//        fsExtra.outputFile(file, result.code, function (err) {
//          if (err !== null) {
//            console.log(err);
//          }
//        });
//      });
    }
  });
}());
