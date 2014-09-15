'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var traceur = require('traceur');
var path = require('path');


function cloneFile(file, override) {
  var File = file.constructor;

  return new File({
  	path: override.path || file.path,
  	cwd: override.cwd || file.cwd,
  	contents: new Buffer(override.contents || file.contents),
  	base: override.base || file.base
  });
}


module.exports = function (options) {
	options = options || {};

	return through.obj(function (file, enc, done) {
		if (file.isNull()) {
			done(null, file);
			return;
		}

		if (file.isStream()) {
			done(new gutil.PluginError('gulp-traceur', 'Streaming not supported'));
			return;
		}

		var compiler = new traceur.Compiler(options);
		var originalFilePath = file.history[0];
		var inputFilename = path.relative(file.base, originalFilePath);
		var outputFilename = file.path;
		var sourceRoot = path.relative(path.dirname(outputFilename), file.base);

		try {
			var transpiledContent = compiler.compile(file.contents.toString(), inputFilename, outputFilename, sourceRoot);
			var sourceMapString = compiler.getSourceMap();

		  if (sourceMapString) {
		    this.push(cloneFile(file, {contents: sourceMapString, path: file.path.replace(/\.js$/, '.map')}));
		  }

		  done(null, cloneFile(file, {contents: transpiledContent}));
		} catch (err) {
			done(new gutil.PluginError('gulp-traceur', err, {
				fileName: originalFilePath
			}));
		}
	});
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
