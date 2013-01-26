wallaby-blog
============

CouchDB-based blog for nodejs.

Installation
------------

First you need to install the node module with all dependencies with npm

    npm install 

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

done
