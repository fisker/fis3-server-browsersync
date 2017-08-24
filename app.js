var path = require('path');
var fs = require('fs');
var args = process.argv.join('|');
var port = /\-\-port\|(\d+)(?:\||$)/.test(args) ? ~~RegExp.$1 : 8080;
var https = /\-\-https\|(true)(?:\||$)/.test(args) ? !!RegExp.$1 : false;
var context = /\-\-context\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : '';
var DOCUMENT_ROOT = path.resolve(
  /\-\-root\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : process.cwd()
);
var bsConfigFile = /\-\-bs\-config\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : '';
var serveIndex = require('serve-index');
var bs = require('browser-sync').create();
var bsUtils = bs.instance.utils;
var bsDefaultConfig = require(path.join(path.dirname(require.resolve('browser-sync')),'./lib/default-config.js'));

function getUserConfig(path) {
  try {
      return require(path);
  } catch (_) {}
}

var userConfigFile = path.resolve(
  context,
  bsConfigFile || bs.instance.config.userFile
);

var serveIndexMiddleWare = {
  route: '',
  handle: serveIndex(DOCUMENT_ROOT, {
    icons: true,
    stylesheet: 'public/style.css',
    template: 'public/directory.html'
  }),
  id: 'Browsersync Server Directory Middleware'
};

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
    getUserConfig(userConfigFile),
    {
      server: {
        baseDir: DOCUMENT_ROOT,
        directory: false
      },
      port: port,
      open: false,
      snippetOptions: {
        rule: {
          match: /<\/body>|<!--\s*browser-sync-script\s*-->/i,
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

  var type = Object.prototype.toString.call(config.middleware).slice(8, -1);

  if (type !== 'Array') {
    if (type === 'Function') {
      config.middleware = [config.middleware];
    } else {
      config.middleware = [];
    }
  }

  config.middleware.push(serveIndexMiddleWare);

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
      if (!relativePath || relativePath === 'server.log' || /(^|[\/\\])[\._]./.test(relativePath)) {
        return;
      }
      bs.reload(file);
      console.log(
        '%s %s: %s',
        new Date().toISOString().slice(11, -1),
        ('         ' + event).slice(-9),
        relativePath
      );
    }
  );
}

process.on('SIGTERM', function() {
  console.log(' Recive quit signal in worker %s.', process.pid);
  bs.exit();
});

startServer();
