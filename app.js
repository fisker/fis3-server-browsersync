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
var serveDirectory = require('serve-directory');
var bs = require('browser-sync').create();
var bsUtils = bs.instance.utils;
var bsDefaultConfig = require(path.join(path.dirname(require.resolve('browser-sync')),'./lib/default-config.js'));
var assign = Object.assign || require('object.assign');

function getUserConfig(path) {
  try {
      return require(path);
  } catch (_) {}
}

var userConfigFile = path.resolve(
  context,
  bsConfigFile || bs.instance.config.userFile
);

var serveDirectoryStyle = fs.readFileSync(path.join(__dirname, './public/style.css'), 'utf-8');

var iconColor = '#6a737d';
var icons = {
  directory: '<svg xmlns="http://www.w3.org/2000/svg" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path fill-rule="evenodd" d="M13 4H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zM6 4H1V3h5v1z"></path></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path d="M6 5H2V4h4v1zM2 8h7V7H2v1zm0 2h7V9H2v1zm0 2h7v-1H2v1zm10-7.5V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v12h10V5z"></path></svg>'
};

var btoa = global.btoa || function(str) {
  return new Buffer(str).toString('base64');
};

function makeSvg(svg) {
  return 'url(data:image/svg+xml;base64,' + btoa(svg.replace('<svg ', '<svg style="fill:#6a737d" ')) +')';
  // ie can't recognize
  // return 'url(data:image/svg+xml;utf8,' + encodeURIComponent(svg.replace('<svg ', '<svg style="fill:#6a737d" ')) +')';
}

icons.directory = makeSvg(icons.directory);
icons.file = makeSvg(icons.file);

var serveIndexMiddleWare = {
  route: '',
  handle: serveDirectory(DOCUMENT_ROOT, {
    template: './public/directory.html',
    style: serveDirectoryStyle,
    icons: icons
  }),
  id: 'Browsersync Server Directory Middleware'
};

function getConfig() {
  var config = assign(
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
      online: false
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
