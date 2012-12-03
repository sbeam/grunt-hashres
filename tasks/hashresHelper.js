/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

var fs    = require('fs'),
    path  = require('path'),
    utils = require('./hashresUtils');

exports.hashAndSub = function(grunt, options) { //files, out, encoding, fileNameFormat) {
  var files            = options.files,
      out              = options.out,
      encoding         = options.encoding,
      fileNameFormat   = options.fileNameFormat,
      renameFiles      = options.renameFiles,
      nameToHashedName = {},
      formatter        = null;

  encoding = (encoding || 'utf8');
  grunt.verbose.write('Using encoding ' + encoding);
  fileNameFormat = (fileNameFormat || '${hash}.${name}.cache.${ext}');
  grunt.verbose.write('Using fileNameFormat ' + fileNameFormat);
  renameFiles = (renameFiles === undefined && renameFiles !== false)? true : false;
  grunt.verbose.write(renameFiles? 'Renaming files' : 'Not renaming files');

  formatter = utils.compileFormat(fileNameFormat);

  // Converting the file to an array if is only one
  files = Array.isArray(files) ? files : [files];
  out = Array.isArray(out) ? out : [out];

  // Renaming the files using a unique name
  grunt.file.expand(files).forEach(function(f) {
    var md5 = utils.md5(f).slice(0, 8),
        fileName = path.basename(f),
        lastIndex = fileName.lastIndexOf('.'),
        renamed = formatter({
          hash: md5,
          name: fileName.slice(0, lastIndex),
          ext: fileName.slice(lastIndex + 1, fileName.length) });

    // Mapping the original name with hashed one for later use.
    nameToHashedName[fileName] = renamed;

    // Renaming the file
    if(renameFiles) {
      fs.renameSync(f, path.resolve(path.dirname(f), renamed));
    }
    grunt.verbose.write(f + ' ').ok(renamed);
  });

  // Substituting references to the given files with the hashed ones.
  grunt.file.expand(out).forEach(function(f) {
    var outContents = fs.readFileSync(f, encoding);
    for (var name in nameToHashedName) {
      grunt.verbose.write('Substituting ' + name + ' by ' + nameToHashedName[name]);

      var ext = name.slice(name.lastIndexOf('.')+ 1, name.length)

      var re_str = 'all.min.[0-9a-f]+\\.'+ ext

      grunt.verbose.write(re_str)

      var re = new RegExp(re_str)

      outContents = outContents.replace(re, nameToHashedName[name]);
    }
    grunt.verbose.write('Saving the updated contents of the outination file');
    fs.writeFileSync(f, outContents, encoding);
  });
};
