var cradle     = require('wallaby-cradle')
  , q          = require('promised-io/promise')
  , fs         = require('fs')
  , async      = require('async')
  , settings   = undefined;

try {
    settings = require('../settings');
} catch (e) {
    console.error('Could not load settings.json');
    return;
}

var couchdbSettings = settings.couchdb;
if (settings.couchdb.user != undefined && settings.couchdb.password != undefined) {
    couchdbSettings['auth']=settings.couchdb.user+':'+settings.couchdb.password;
}
couchdbSettings['raw'] = false;
couchdbSettings['cache'] = false;

var connection = new(cradle.Connection)(couchdbSettings)
  , database   = connection.database(couchdbSettings.db);

function get (docID) {
    var defer = q.defer();

    try {
        database.get(docID, function (err, doc) {
            if (err) {
                console.error("get("+docID+"): "+JSON.stringify(err));
                defer.reject(err);
            } else
                defer.resolve(doc);
        });
    } catch (e) {
        console.error("Exception in couchdb.get: "+e);
        defer.reject(e);
    }

    return defer.promise;
}

exports.get = function (docID) {
    return get (docID);
};

exports.save = function (doc) {
    var defer = q.defer();

    try {
        database.save(doc, function (err, res) {
            if (err) {
                console.error("save("+doc+"): "+JSON.stringify(err));
                defer.resolve();
            } else
                defer.resolve(res);
        });
    } catch (e) {
        console.error("Exception in couchdb.save: "+e);
        defer.reject(e);
    }

    return defer.promise;
};

exports.view = function (viewID,options) {
    var defer = q.defer();

    try {
        database.view(viewID,options, function (err, res) {
            if (err) {
                console.error("view("+viewID+"): "+JSON.stringify(err));
                defer.reject(err);
            } else
                defer.resolve(res);
        });
    } catch (e) {
        console.error("Exception in couchdb.view: "+e);
        defer.reject(e);
    }

    return defer.promise;
};

exports.merge = function (docID, mergeDict) {
    var defer = q.defer();

    try {
        database.merge(docID, mergeDict, function (err, res) {
            if (err) {
                if (err.error == "not_found") {
                    database.put (docID, mergeDict, function (err, res) {
                        defer.resolve();
                    });
                } else {
                    console.error("merge("+docID+"): "+JSON.stringify(err));
                    defer.resolve();
                }
            } else
                defer.resolve(res);
        });
    } catch (e) {
        console.error("Exception in couchdb.merge: "+e);
        defer.reject(e);
    }

    return defer.promise;
};

exports.deleteFile = function (docID, attachment) {
    var defer = q.defer();

    try {
        get(docID).then(function (doc) {
            database.removeAttachment(doc, attachment, function (err, res) {
                if (err) {
                    console.error("deleteFile("+docID+","+attachment+"): "+JSON.stringify(err));
                    defer.reject(err);
                } else
                    defer.resolve();
            });
        });
    } catch (e) {
        console.error("Exception in couchdb.deleteFile: "+e);
        defer.reject(e);
    }

    return defer.promise;
};

function uploadMultipleFiles (docID, attachments) {
    var defer = q.defer();

    try {
        get(docID).then(function (res) {
            var doc={'id':docID,'rev':res['_rev']};
            async.forEachSeries(attachments, function(queuedAttachment, callback) {
                if (queuedAttachment['file'] == undefined || queuedAttachment['file'].length == 0) {
                    callback();
                } else {
                    return fs.readFile(queuedAttachment['file'], function (err,data) {
                        if (err) {
                            console.error("could not read file: "+queuedAttachment['file']);
                            callback();
                        } else {
                            var attachment={'body':data};
                            if (queuedAttachment['name']) attachment['name']=queuedAttachment['name'];
                            else attachment['name']=queuedAttachment['file'].replace(/^.*[\\\/]/, '');
                            if (queuedAttachment['content-type']) attachment['content-type']=queuedAttachment['content-type'];

                            database.saveAttachment(doc, attachment, function (err, res) {
                                if (err) {
                                    console.error("uploadMultipleFiles("+docID+","+attachment+"): "+JSON.stringify(err));
                                    defer.reject(err);
                                } else {
                                    doc['rev']=res['rev'];
                                }
        
                                callback();
                            });
                        }
                    });
                }
            }, function(err) {
                defer.resolve();
            });
        });
    } catch (e) {
        console.error("Exception in couchdb.uploadMultipleFiles: "+e);
        defer.reject(e);
    }

    return defer.promise;
}

exports.uploadMultipleFiles = function (docID, attachments) {
    return uploadMultipleFiles(docID, attachments);
};

exports.uploadFile = function (docID, file, name, contentType) {
    attachment = {"file":file};
    if (name) attachment['name']=name;
    if (contentType) attachment['content-type']=contentType;
    else attachment['content-type']='application/octet-stream';

    return uploadMultipleFiles(docID, [attachment]);
};

exports.createDatabase = function () {
    var defer = q.defer();

    try {
        database.create(function (err,res) {
            if (err) {
                console.error("createDatabase(): "+JSON.stringify(err));
                defer.reject(err);
            } else {
                defer.resolve();
            }
        });
    } catch (e) {
        console.error("Exception in couchdb.createDatabase: "+e);
        defer.reject(e);
    }

    return defer.promise;
};
