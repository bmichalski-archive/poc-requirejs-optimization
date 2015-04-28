(function () {
  'use strict';

  var requirejs = require('requirejs');

  var fs = require('fs');
  
  var fsExtra = require('fs-extra');
  
  var UglifyJS = require('uglify-js');
  
  var buildDirectory = __dirname + '/build';
  
  var sourcesDirectory = __dirname + '/scripts';
  
  var dontOptimizeWithRequire = ['run'];

  function handleError(err) {
    console.log(err);
    throw new Error('');
  }

  function onDirRecurseAbsolute(dir, doWithFile, allDone, initDir, countHolder) {
    var visitedDir = {};    
    
    if (countHolder === undefined) {
      countHolder = { count: 0 };
    }
    
    function incrementCount() {
      countHolder.count += 1;
    }
    
    function decrementCount() {
      countHolder.count -= 1;
      if (countHolder.count === 0) {
        allDone();
      }
    }
    
    if (initDir === undefined) {
      initDir = dir;
    }
    
    incrementCount();

    fs.readdir(dir, function (err, files) {
      if (err !== null) {
        handleError(err);
      } else {
        files.forEach(function (file) {
          var filepath = dir + '/' + file;
          
          incrementCount();
          
          fs.stat(filepath, function (err, result) {
            if (err !== null) {
              handleError(err);
            } else {
              if (result.isDirectory()) {
                incrementCount();
                
                fs.realpath(filepath, function (err, realpath) {
                  if (err !== null) {
                    handleError(err);
                  } else {
                    //Preventing infinite loop with symlinks
                    if (visitedDir[realpath] === undefined) {
                      visitedDir[realpath] = true;
                      onDirRecurseAbsolute(filepath, doWithFile, allDone, initDir, countHolder);
                    }
                    
                    decrementCount();
                  }
                });
              } else {
                incrementCount();
                
                doWithFile(filepath, decrementCount, initDir);
              }
              
              decrementCount();
            }
          });
        });
        
        decrementCount();
      }
    });
  }
  
  function onDirRecurseRelative(dir, doWithFile, allDone, initDir) {
    onDirRecurseAbsolute(dir, function (filepath, done, initDir) {
      var relativePath = filepath.substr(initDir.length + 1);
      doWithFile(relativePath, done);
    }, allDone, initDir);
  }

  onDirRecurseRelative(sourcesDirectory, function (relativeFilePath, done) {
    var moduleName = relativeFilePath.substr(0, relativeFilePath.length - 3);
    var out = buildDirectory + '/' + moduleName + '.js';
    
    if (dontOptimizeWithRequire.indexOf(moduleName) === -1) {
      requirejs.optimize({
        baseUrl: sourcesDirectory,
        name: moduleName,
        out: out,
      }, function (buildResponse) {
        done();
      }, function(err) {
        handleError(err);
      });
    } else {
      fsExtra.copy(sourcesDirectory + '/' + relativeFilePath, out, function (err) {
        if (err !== null) {
          handleError(err);
        }
        
        fsExtra.readFile(out, 'utf8', function (err, result) {
          if (err !== null) {
            handleError(err);
          }
          
          var result = UglifyJS.minify(out, {
            define: ['require']
          });
          
          fsExtra.outputFile(out, result.code, function (err) {
            if (err !== null) {
              handleError(err);
            }
            
            done();
          });
        });
      });
    }
  }, function () {
    console.log('All done.');
  });
}());
