var elastical  = require('elastical')
  , q          = require('promised-io/promise')
  , settings   = undefined;

try {
    settings = require('../../../settings');
} catch (e) {
    console.error('Could not load settings.json');
    return;
}

if (settings.elasticsearch != undefined) {
    settings.couchdb.filter = "blog/posts";
    var client = new elastical.Client(settings.elasticsearch.host, settings.elasticsearch);
    var options = {type:"couchdb",index:{index:settings.couchdb.db},couchdb:settings.couchdb};
}

function search (keyword) {
    var defer = q.defer();

    try {
        client.search({index:settings.couchdb.db,query:keyword}, function (err, results, res) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(results);
            }
        });
    } catch (e) {
        console.error("Exception in search.search: "+JSON.stringify(e));
        defer.reject(e);
    }

    return defer.promise;
}

exports.search = function (keyword) {
    return search(keyword);
};

function putRiver () {
    var defer = q.defer();

    try {
        client.putRiver(client, settings.couchdb.db, options, function (err, res) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(res);
            }
        });
    } catch (e) {
        defer.reject(e);
    }

    return defer.promise;
}

function getRiver () {
    var defer = q.defer();

    try {
        client.getRiver(client, settings.couchdb.db, function (err, res) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(res);
            }
        });
    } catch (e) {
        defer.reject(e);
    }

    return defer.promise;
}

function deleteRiver () {
    var defer = q.defer();

    try {
        client.deleteRiver(client, settings.couchdb.db, function (err, res) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(res);
            }
        });
    } catch (e) {
        defer.reject(e);
    }

    return defer.promise;
}

function deleteIndex () {
    var defer = q.defer();

    try {
        client.deleteIndex(settings.couchdb.db, function (err, res) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(res);
            }
        });
    } catch (e) {
        defer.reject(e);
    }

    return defer.promise;
}

if (settings.elasticsearch != undefined) {
    getRiver().then(function (res) {
        if (res.exists != true || JSON.stringify(res._source) != JSON.stringify(options)) {
            deleteRiver().then(function (res) {
                deleteIndex().then(function (res) {
                    putRiver().then(function (res) {
                        console.error("[ElasticSearch] River update success: "+JSON.stringify(res));
                    }, function (err) {
                        console.error("[ElasticSearch] Error updating river: "+JSON.stringify(err));
                    });
                }, function (err) {
                    console.error("[ElasticSearch] Error deleting index: "+JSON.stringify(err));
                });
            }, function (err) {
                console.error("[ElasticSearch] Error deleting river: "+JSON.stringify(err));
            });
        } else {
            console.error("[ElasticSearch] River up to date!");
        }
    }, function (err) {
        putRiver().then(function (res) {
            console.error("[ElasticSearch] River install success: "+JSON.stringify(res));
        }, function (err) {
            console.error("[ElasticSearch] Error installing river: "+JSON.stringify(err));
        });
    });
}
