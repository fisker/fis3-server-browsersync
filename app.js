var path = require('path');
var fs = require('fs');
var args = process.argv.join('|');
var port = /\-\-port\|(\d+)(?:\||$)/.test(args) ? ~~RegExp.$1 : 8080;
var https = /\-\-https\|(true)(?:\||$)/.test(args) ? !!RegExp.$1 : false;
var DOCUMENT_ROOT = path.resolve(
  /\-\-root\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : process.cwd()
);
var bsConfigFile = /\-\-bs\-config\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : '';
var bs = require('browser-sync').create();
var chokidar = require('chokidar');
var bsUtils = bs.instance.utils;
var bsDefaultConfig = require('./node_modules/browser-sync/lib/default-config.js');

function getUserConfig(path) {
  try {
    var userConfig = require(path);
    if (bsUtils.verifyConfig(userConfig)) {
      return userConfig;
    }
  } catch (_) {}
}

var userConfigFile = path.resolve(
  process.cwd(),
  bsConfigFile || bs.instance.config.userFile
);


if (fs.existsSync(userConfigFile)) {
  // TODO:  watch bs-config.js
  // var watcher = chokidar.watch(userConfigFile);
  // watcher.on('change', startServer);
  // watcher.on('unlink', startServer);
  // watcher.on('add', startServer);
}

function getConfig() {
  var config = Object.assign(
    {},
    bsDefaultConfig,
    {
      watchEvents: [
        'change',
        'add',
        'addDir',
        'unlink',
        'unlinkDir'
      ],
      ghostMode: false,
      reloadDebounce: 500,
      notify: false,
    },
    getUserConfig(),
    {
      server: {
        baseDir: DOCUMENT_ROOT,
        directory: true
      },
      port: port,
      open: false
    }
  );

  if (!https) {
    config.https = false;
  }
  return config;
}


function startServer() {
  var bsConfig = getConfig();

  bs.exit();
  bs.init(bsConfig, function() {
    console.log(
      'Listening on ' + (https ? 'https' : 'http') + '://127.0.0.1:%d',
      port
    );
  });

  bs.watch(
    path.join(DOCUMENT_ROOT, '**/*'),
    {
      ignored: path.join(DOCUMENT_ROOT, '**/*.log')
    },
    function(event, path) {
      console.log(new Date().toJSON() + ' ' + event + ': ' + path);
      bs.reload(path);
    }
  );
}

process.on('SIGTERM', function() {
  console.log(' Recive quit signal in worker %s.', process.pid);
  bs.exit();
});

startServer();