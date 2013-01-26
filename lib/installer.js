var couchdb = require('./couchdb');

exports.installDesignDoc = function () {
    var designDoc = {
      _id: '_design/blog',

      language: 'javascript',

      filters: {
        'posts': function(doc, req) {
           return (doc._deleted || doc.type === 'post');
        }.toString()
      },

      views: {
        'posts_by_date': {
            map: function(doc) {
                if (doc.type === 'post' && doc.published == true) {
                    emit(doc.postedAt, doc);
                }
            }.toString(),
            reduce: "_count"
        },
        'posts_by_category_date': {
            map: function(doc) {
                if (doc.type === 'post' && doc.postedAt && doc.postedAt.length == 6 && doc.published == true) {
                    for (var i in doc.categories) {
                        emit([doc.categories[i],doc.postedAt[0],doc.postedAt[1],doc.postedAt[2],doc.postedAt[3],doc.postedAt[4],doc.postedAt[5]], doc);
                    }
                }
            }.toString(),
            reduce: "_count"
        },
        'all_posts_by_date': {
            map: function(doc) {
                if (doc.type === 'post') {
                    emit(doc.postedAt, doc);
                }
            }.toString()
        },
        'counts': {
            map: function(doc) {
                if (doc.type === 'post' && doc.postedAt && doc.postedAt.length == 6 && doc.published == true) {
                    var value={'title':doc.name,'_id':doc._id};
                    var key=['date'];
                    for (var i=0;i<6;i++) key[i+1]=doc.postedAt[i];
                    emit(key,value);

                    if (doc.categories) {
                        for (var i in doc.categories) {
                            emit(['category',doc.categories[i]],value);
                        }
                    }
                }
            }.toString()
        }
      }
    };

    return couchdb.save(designDoc).then (function (res) {
        return couchdb.save({'_id':'config'});
    });
};
