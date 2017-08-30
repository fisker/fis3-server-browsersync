'use strict';

var fs = require('fs');
var path = require('path');
var serveDirectory = require('serve-directory');
var filesize = require('filesize');

var style = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf-8');

var iconColor = '#6a737d';
var icons = {
  directory: '<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 12 16" width="12"><path fill-rule="evenodd" d="M13 4H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zM6 4H1V3h5v1z"></path></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 12 16" width="12"><path d="M6 5H2V4h4v1zM2 8h7V7H2v1zm0 2h7V9H2v1zm0 2h7v-1H2v1zm10-7.5V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v12h10V5z"></path></svg>'
};

var btoa = global.btoa || function(str) {
  return new Buffer(str).toString('base64');
};

function makeSvg(svg) {
  return 'url(data:image/svg+xml;base64,' + btoa(svg.replace('<svg ', '<svg fill="#6a737d" ')) +')';
  // ie can't recognize
  // return 'url(data:image/svg+xml;utf8,' + encodeURIComponent(svg.replace('<svg ', '<svg style="fill:#6a737d" ')) +')';
}

icons.directory = makeSvg(icons.directory);
icons.file = makeSvg(icons.file);

var config = {
  template: fs.readFileSync(path.join(__dirname, '../public/directory.html'), 'utf-8').replace(/>\s*</g , '><'),
  style: style,
  icons: icons,
  filesize: filesize
};

function getServeDirectoryMiddleWare(root) {
  return {
    route: '',
    handle: serveDirectory(root, config),
    id: 'Browsersync Server Directory Middleware'
  }
}

module.exports = getServeDirectoryMiddleWare;
