
var path = require('path');
var args = process.argv.join('|');
var port = /\-\-port\|(\d+)(?:\||$)/.test(args) ? ~~RegExp.$1 : 8080;
var https = /\-\-https\|(true)(?:\||$)/.test(args) ? !!RegExp.$1 : false;
var DOCUMENT_ROOT = path.resolve(/\-\-root\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : process.cwd());
var bsConfigFile = /\-\-bs\-config\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : false;
var bs = require('browser-sync').create();
var bsConfig = {
  notify: false
};

if (bsConfigFile) {
  var maybeconf = path.resolve(process.cwd(), bsConfigFile);
  try {
    var conf = require(maybeconf);
    Object.assign(bsConfig, conf);
  } catch(_) {}
}

Object.assign(bsConfig, {
  server: {
    baseDir: DOCUMENT_ROOT,
    directory: true,
  },
  port: port,
  https: https ? {
    key: 'key.pem',
    cert: 'cert.pem'
  } : false,
  open: false
});

bs.init(bsConfig, function() {
  console.log('Listening on ' + (https ? 'https' : 'http') + '://127.0.0.1:%d', port);
});

bs.watch(path.join(DOCUMENT_ROOT, '**/*'), {
  ignored: path.join(DOCUMENT_ROOT, '**/*.log')
}, function (event, path) {
  console.log(new Date().toJSON() + ' ' + event + ': ' + file);
  bs.reload(path);
});
