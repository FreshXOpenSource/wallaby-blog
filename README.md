wallaby-blog
============

CouchDB-based blog engine for nodejs.

Installation
------------

First you need to install the node module with all dependencies with npm

    npm install https://github.com/FreshXOpenSource/wallaby-blog/tarball/RELEASE_0_1_0

settings.json:

```json
{
    "couchdb": {
        "host":"127.0.0.1",
        "port":5984,
        "db":"DATABASENAME",
        "user":"USER",
        "password":"PASSWORD"
    },
    "elasticsearch": {
        "host":"127.0.0.1",
        "port":9200
    },
    "listenPort":8080
}
```

app.js:

```javascript
require('wallaby-blog').start();
```

start:

```bash
node app.js
```

Use the default templates:

```bash
ln -s node_modules/wallaby-blog/views
ln -s node_modules/wallaby-blog/public
```

done
