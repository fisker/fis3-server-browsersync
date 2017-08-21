var args = process.argv.join('|');
var port = /\-\-port\|(\d+)(?:\||$)/.test(args) ? ~~RegExp.$1 : 8080;
var https = /\-\-https\|(true)(?:\||$)/.test(args) ? !!RegExp.$1 : false;
var path = require('path');
var DOCUMENT_ROOT = path.resolve(/\-\-root\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : process.cwd());
var bs = require('browser-sync').create();

    // Listen for the `init` event
bs.emitter.on("init", function () {
  console.log('Listening on ' + (https ? 'https' : 'http') + '://127.0.0.1:%d', port);
});

bs.init({
  server: {
    baseDir: DOCUMENT_ROOT,
    directory: true,
  },
  notify: false,
  port: port,
  ui: {
    port: + port + 1,
    weinre: {
      port: + port + 2
    }
  },
  https: https ? {
    key: 'key.pem',
    cert: 'cert.pem'
  } : false,
  open: false
});

bs.watch(path.join(DOCUMENT_ROOT, '**/*'), {ignored: path.join(DOCUMENT_ROOT, '**/*.log')},function (event, file) {
  console.log(new Date().toJSON() + ' ' + event + ': ' + file);
  bs.reload(file);
});
