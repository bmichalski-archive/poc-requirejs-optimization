(function () {
  'use strict';

  var requirejs = require('requirejs');

  var config = {
    baseUrl: '',
    name: 'test',
    out: __dirname + '/build/built.js'
  };

  var fs = require('fs');
  
  var fsExtra = require('fs-extra');

  function onDirRecurse(dir, doWithFile, initDir) {
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
                      onDirRecurse(filepath, doWithFile, initDir);
                    }
                  }
                });
              } else {
                var relativePath = filepath.substr(initDir.length + 1);
                
                doWithFile(relativePath);
              }
            }
          });
        });
      }
    });
  }
  
  var ignore = ['run'];

  onDirRecurse(__dirname + '/scripts', function (relativeFilePath) {
    var moduleName = relativeFilePath.substr(0, relativeFilePath.length - 3);
    var out = __dirname + '/build/' + moduleName + '.js';
    
    if (ignore.indexOf(moduleName) === -1) {
      requirejs.optimize({
        baseUrl: __dirname + '/scripts',
        name: moduleName,
        out: out,
      }, function (buildResponse) {
      }, function(err) {
          console.log(err);
      });
    } else {
      fsExtra.copy(__dirname + '/scripts/' + relativeFilePath, out, function (err) {
        if (err !== null) {
          console.log(err);
        }
      });
    }
  });
}());
