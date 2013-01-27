wallaby-blog
============

CouchDB-based blog engine for nodejs.

Installation
------------

First you need to install the node module with all dependencies with npm

    npm install wallaby-blog

Then you must create the following two files:

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

> Note: Feel free to remove the elasticsearch part if you don't want to install java software on your server.

app.js:

```javascript
require('wallaby-blog').start();
```

To use our default template files just create the following to symbolic links or copy the *views* and *public* folders

```bash
ln -s node_modules/wallaby-blog/views
ln -s node_modules/wallaby-blog/public
```

To start the blog-engine simply type

```bash
node app.js
```

done
