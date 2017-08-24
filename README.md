## fis3-server-browsersync

fis3 debug server based on browser-sync.

## install
```sh
npm i -g fis3-server-browsersync
```

## ustage
```sh
fis3 server start --type browsersync
```

## custom config
put `bs-config.js` in the source folder, it will automatic load

OR

```sh
fis3 server start --type browsersync --bs-config path/to/bs-config.js
```

see https://browsersync.io/docs/options