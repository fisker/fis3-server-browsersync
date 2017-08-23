var path = require('path');
var fs = require('fs');
var args = process.argv.join('|');
var port = /\-\-port\|(\d+)(?:\||$)/.test(args) ? ~~RegExp.$1 : 8080;
var https = /\-\-https\|(true)(?:\||$)/.test(args) ? !!RegExp.$1 : false;
var DOCUMENT_ROOT = path.resolve(
  /\-\-root\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : process.cwd()
);
var bsConfigFile = /\-\-bs\-config\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : '';
var serveIndex = require('serve-index');
var bs = require('browser-sync').create();
// var chokidar = require('chokidar');
var bsUtils = bs.instance.utils;
var bsDefaultConfig = require(path.join(path.dirname(require.resolve('browser-sync')),'./lib/default-config.js'));

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
      open: false,
      snippetOptions: {
        rule: {
          match: /<\/body>/i,
          fn: function (snippet, match) {
            return snippet + match;
          }
        }
      }
    }
  );

  if (!https) {
    config.https = false;
  }

  if (typeof config.middleware !== 'array') {
    if (typeof config.middleware === 'function') {
      config.middleware = [config.middleware];
    } else {
      config.middleware = [];
    }

    config.middleware.push({
      route: '',
      handle: serveIndex(DOCUMENT_ROOT, {
        icons: true,
        stylesheet: 'public/style.css',
        template: 'public/directory.html'
      }),
      id: 'Browsersync Server Directory Middleware'
    });
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
    DOCUMENT_ROOT,
    function(event, file) {
      var relativePath = path.relative(DOCUMENT_ROOT, file);
      if (relativePath === 'server.log' || /(^|[\/\\])[\._]./.test(relativePath)) {
        return;
      }
      console.log(new Date().toJSON() + ' ' + event + ': ' + relativePath);
      bs.reload(file);
    }
  );
}

process.on('SIGTERM', function() {
  console.log(' Recive quit signal in worker %s.', process.pid);
  bs.exit();
});

startServer();
