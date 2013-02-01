var couchdb    = require('./couchdb')
  , installer  = require('./installer')
  , search     = require('./search')
  , q          = require('promised-io/promise')
  , $          = require('jquery')
  , uuid       = require('node-uuid')
  , fs         = require('fs')
  , easyimg    = require('easyimage')
  , util       = require('util')
  , partials   = require('./partials')
  , i18n       = require("i18n");

try {
    var settings = require('../../../settings');
} catch (e) {
    util.log('Could not load settings.json');
    return;
}

//set available locales
locales().then(function(locales) {
    i18n.configure({
        locales:locales,
        register:global
    });
});

setLocale();

function setLocale() {
    config().then(function(config) {
        i18n.setLocale(config.locale);
    }, function(err) {
        i18n.setLocale('en');
    });
};

exports.setLocale = function () {
    return setLocale();
};

function locales() {
    var defer = q.defer();

    fs.readdir('locales',function (err,files) {
        if (err) {
            util.log('locale error: ',err);
            defer.reject(err);
        } else {
            var locales = [];
            for (i in files) {
                locales.push(files[i].slice(0,-3));
            }
            defer.resolve(locales);
        }
    });

    return defer.promise;
}

exports.locales = function () {
    return locales();
};

exports.readFile = function (file) {
    var defer = q.defer();

    try {
        fs.readFile(file, function (err,data) {
            if (err) {
                util.log("could not read file("+file+"): "+err);
                defer.reject(err);
            } else if (data) {
                defer.resolve(data);
            }
        });
    } catch (e) {
        util.log('Could not read file: '+e);
        defer.reject(e);
    }

    return defer.promise;
};

exports.resizeImage = function (file) {
    var defer = q.defer();

    try {
        easyimg.info(file, function (err,stdout,stderr) {
            if (stdout) {
                var width=parseInt(stdout['width']);
                var height=parseInt(stdout['height']);

                if (width>800 || height>800) {
                    if (width>height) {
                        height=(height/width)*800;
                        width=800;
                    }else {
                        height=800;
                        width=(width/height)*800;
                    }
                    easyimg.resize({"src":file,"dst":file,"width":width,"height":height},function(err,stdout,stderr){
                        defer.resolve(file);
                    });
                } else {
                    defer.resolve(file);
                }
            } else {
                defer.resolve(file);
            }
        });
    } catch (e) {
        util.log('Could not resize image: '+e);
        defer.resolve(file);
    }

    return defer.promise;
};

exports.translator = function() {
    return function(str){
        return __(str);
    };
}

function config () {
    var defer = q.defer();

    couchdb.get('config').then(function (config) {
        config['hasTitleImage']=(config['_attachments'] && config['_attachments']['titleImage.png']);
        config['hasSearch']=(settings['elasticsearch'] != undefined);

        defer.resolve(config);
    }, function (err) {
        defer.reject(err);
    });

    return defer.promise;
}

exports.config = function () {
    return config();
};


function preparePost (post) {
    try {
        post['date']=new Date(post['postedAt'][0],post['postedAt'][1]-1,post['postedAt'][2],post['postedAt'][3],post['postedAt'][4],post['postedAt'][5]).toGMTString();

        categories = post['categories'];
        if (categories != undefined) {
            categoryDicts=[];
            for (var i=0;i<categories.length;i++) {
                categoryDicts[i]={'category':categories[i]}
            }
            post['categoryDicts']=categoryDicts;
        }

        segments = post['segments'];
        if (segments != undefined) {
            for (var i=0;i<segments.length;i++) {
                segment=segments[i];
                segment["_id"]=post["_id"];
                segment["number"]=i;
                segment['first']=(i==0);
                segment['last']=(i==segments.length-1);

                if (segment["thumbnails"] != undefined) {
                    segment["hasThumbnails"]=true;
                    for (var j=0;j<segment["thumbnails"].length;j++) {
                        thumbnail=segment["thumbnails"][j];
                        thumbnail["_id"]=post["_id"];
                        thumbnail['number']=i;
                        segment['image_'+j]=thumbnail['image'];

                        var num=0;
                        var caption=undefined;
                        for (var k=0;k<post['images'].length;k++) {
                            var image = post['images'][k];
                            if (thumbnail['image'] == image['attachment']) {
                                num=k;
                                caption = image['caption'];
                                break;
                            }
                        }
                        thumbnail["imageNumber"]=num;
                        thumbnail["caption"]=caption;
                    }
                } else {
                    segment["hasThumbnails"]=false;
                }

                if (segment["image"] != undefined) {
                    segment["hasImage"]=true;
                    if (segment["image"].length == 0) delete segment["image"];
                    else {
                        var num=0;
                        var caption=undefined;
                        for (var j=0;j<post['images'].length;j++) {
                            var image = post['images'][j];
                            if (segment['image'] == image['attachment']) {
                                num=j;
                                caption = image['caption'];
                                break;
                            }
                        }
                        segment["imageNumber"]=num;
                        segment["caption"]=caption;
                    }
                }

                if (segment["text"] != undefined) {
                    segment["hasText"]=true;
                }

                if (segment["markdown"] != undefined) {
                    segment["hasMarkdown"]=true;
                }
                else if (segment["html"] != undefined) {
                    segment["hasHtml"]=true;
                }
            }
        }

        images = post['images'];
        if (images != undefined) {
            for (var i=0;i<images.length;i++) {
                image=images[i];
                image["_id"]=post["_id"];
                image["active"]=(i==0);
                image["number"]=i;
                image['first']=(i==0);
                image['last']=(i==images.length-1);
            }
            post['hasImages']=(images.length>0);
        }

        attachments = post['attachments'];
        if (attachments != undefined) {
            for (var i=0;i<attachments.length;i++) {
                attachment=attachments[i];
                attachment["_id"]=post["_id"];
                attachment["filenameUrlEncoded"]=encodeURI(attachment["filename"]);

                attachment["number"]=i;
                var _attachment = post['_attachments'][attachment['attachment']];
                attachment["content_type"]=_attachment['content_type'];

                var length = _attachment['length'];
                var filesize = length+" B";
                if (length > 1048576)filesize = parseInt(length/1048576)+" MiB";
                else if (length > 1024)filesize = parseInt(length/1024)+" KiB";
                attachment['filesize']=filesize;
            }
            post['hasAttachments']=(attachments.length>0);
        }

        links = post['links'];
        if (links != undefined) {
            for (var i=0;i<links.length;i++) {
                link=links[i];
                link["number"]=i;
                link["_id"]=post['_id'];
            }
            post['hasLinks']=(links.length>0);
        }

        post['hasAttachmentsOrLinks'] = (post['hasLinks'] == true || post['hasAttachments'] == true);
    } catch (e) {
        util.log('Could not prepare post: '+e+" ("+JSON.stringify(post)+")");
    }

    return post;
}

exports.preparePost = function (post) {
    return preparePost(post);
};

function monthName(month) {
    switch (month) {
        case 1:
            return __("January");
        case 2:
            return __("February");
        case 3:
            return __("March");
        case 4:
            return __("April");
        case 5:
            return __("May");
        case 6:
            return __("June");
        case 7:
            return __("July");
        case 8:
            return __("August");
        case 9:
            return __("September");
        case 10:
            return __("October");
        case 11:
            return __("November");
        case 12:
            return __("December");
        default:
            return "MonthNotFound("+month+")";
    }
}

exports.posts = function (viewEngine, year, month, category, page) {
    return config().then(function(config) {
        try {
            locals=config;

            var path = 'blog/posts_by_date';
            var options = {"descending":true,"reduce":false};
            var limit = parseInt(config['postsPerPage']);
            if (config['pagination']) {
                options['limit']=limit;
                options['skip']=(parseInt(page)-1)*limit;
            }
            var startkey = undefined;
            var endkey = undefined;
            var paginationPath = "";

            if (category) {
                locals['category']=category;
                paginationPath+="/category/"+category;
            }

            if (year) {
                if (month) {
                    startkey = [parseInt(year), parseInt(month)+1];
                    endkey = [parseInt(year), parseInt(month)];

                    locals['category']=monthName(parseInt(month))+" "+year;
                    paginationPath+="/date/"+year+"/"+month;
                } else {
                    endkey = [parseInt(year)];
                    startkey = [parseInt(year)+1];

                    paginationPath+="/date/"+year;
                    locals['category']=year;
                }
            }

            locals['previousPath']=paginationPath+"/page/"+(parseInt(page)+1);
            if (parseInt(page)==2) {
                if (paginationPath == "")locals['nextPath']='/';
                else locals['nextPath']=paginationPath;
            } else {
                locals['nextPath']=paginationPath+"/page/"+(parseInt(page)-1);
            }

            if (category) {
                path = 'blog/posts_by_category_date';

                if (year) {
                    endkey.unshift(category);
                    startkey.unshift(category);
                } else {
                    endkey = [category,0];
                    startkey = [category,10000];
                }
            }

            if (endkey) options["endkey"] = endkey;
            if (startkey) options["startkey"] = startkey;

            var countOptions = $.extend({}, options);
            countOptions['group_level']=1;
            countOptions['reduce']=true;
            return couchdb.view(path,countOptions).then(function(countRes) {
                return couchdb.view(path,options).then(function(res) {
                    var totalRows=res['total_rows'];
                    if (category && countRes && countRes['rows'] && countRes['rows'][0])totalRows = countRes['rows'][0]['value']

                    var pages = totalRows/limit;

                    locals["hasPrevious"]=(page<pages);
                    locals["hasNext"]=(page>1);

                    var posts = res['rows'].map(function(row) {
                            return preparePost(row['value']);
                        }
                    );

                    locals["posts"]=posts;

                    return counts().then(function(counts) {
                        locals["counts"]=counts;
                        locals["siteTitle"]=locals['title']+" | "+locals['subtitle'];

                        return viewEngine.respond('posts.html', {locals:locals,partials:partials.list});
                    });
                });
            });
        } catch (e) {
            util.log('Could not load posts: '+e);
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown error."}});
        }
    },function(err) {
        if (err.reason == "no_db_file") {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Database does not exist.","solutionText":"Create Database ("+settings.couchdb.db+")","solutionURL":"/admin/createDatabase"}});
        } else if (err.reason != undefined) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Design Document Missing.","solutionText":"Install Design Document","solutionURL":"/admin/installDesignDocument"}});
        } else {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"CouchDB server not reachable."}});
        }
  });
};

exports.search = function (viewEngine, keyword) {
    return config().then(function(config) {
        try {
            locals=config;

            return search.search(keyword).then(function(res) {
                var posts = res['hits'].map(function(row) {
                        var post = preparePost(row['_source']);

                        segments = post['segments'];
                        if (segments != undefined) {
                            for (var i=0;i<segments.length;i++) {
                                segment=segments[i];

                                if (segment["thumbnails"] != undefined) {
                                    for (var j=0;j<segment["thumbnails"].length;j++) {
                                        thumbnail=segment["thumbnails"][j];
                                        if(thumbnail["caption"] != undefined)
                                            thumbnail["caption"] = thumbnail["caption"].replace(new RegExp('('+keyword+')','gi'),"<span class='searchHighlight'>$1</span>");
                                    }
                                }

                                if (segment["image"] != undefined) {
                                    if(segment["caption"] != undefined)
                                        segment["caption"] = segment["caption"].replace(new RegExp('('+keyword+')','gi'),"<span class='searchHighlight'>$1</span>");
                                }

                                if (segment["text"] != undefined) {
                                    segment["text"] = segment["text"].replace(new RegExp('('+keyword+')','gi'),"<span class='searchHighlight'>$1</span>");
                                }
                            }
                        }

                        return post;
                    }
                );

                locals["posts"]=posts;
                locals["noSearchResults"] = (posts.length==0);
                locals["category"] = posts.length+" search result"+((posts.length==1)?"":"s")+" for \""+keyword+"\"";
                locals["searchKeyword"]=keyword;

                return counts().then(function(counts) {
                    locals["counts"]=counts;
                    locals["siteTitle"]=locals['title']+" | "+locals['subtitle'];

                    return viewEngine.respond('posts.html', {locals:locals,partials:partials.list});
                }, function(err) {
                    return viewEngine.respond('posts.html', {locals:{"error":true,"message":"ElasticSearch server not reachable."}});
                });
            });
        } catch (e) {
            util.log('Could not load posts: '+e);
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown error."}});
        }
    },function(err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"CouchDB server not reachable."}});
  });
};


function counts () {
    return couchdb.view('blog/counts',{"descending":true}).then(function(res) {
        try {
            var categories=[];
            var categoriesDict={};
            var dates=[];
            var datesDict={};
            var lastPosts=[];

            for (var i in res['rows']) {
                var row = res['rows'][i];
                var key = row['key'];
                var value = row['value'];
                var id = key.splice(0,1)[0];

                if (id == 'category') {
                    var category = key[0];
                    if (category != null && category != "") {
                        var categoryDict = categoriesDict[category];
                        if (categoryDict == undefined) {
                            categoryDict = {"name":category,"nameUrlEncoded":encodeURI(category),"count":0,"titles":[],"num":categories.length};
                            categories.push(categoryDict);
                            categoriesDict[category]=categoryDict;
                        }

                        categoryDict['count']++;
                        categoryDict['titles'].push(value);
                    }
                } else {
                    var year = parseInt(key[0]);
                    var month = parseInt(key[1]);

                    var yearDict = datesDict[year];
                    if (yearDict == undefined) {
                        yearDict = {"name":year,"count":0,"months":[]};
                        dates.push(yearDict);
                        datesDict[year] = yearDict;
                    }

                    var monthDict = yearDict['months'][13-month];
                    if (monthDict == undefined) {
                        monthDict = {"name":monthName(month),"month":month,"year":year,"count":0,"titles":[]};
                        yearDict['months'][13-month] = monthDict;
                    }

                    yearDict['count']++;
                    monthDict['count']++;
                    monthDict['titles'].push(value);
                    if (lastPosts.length<5)lastPosts.push(value);
                }
            }

            categories = categories.sort(function(a,b){return a["name"]<b["name"]?-1:1});

            for(i in dates){
                newMonths = []
                for(j=0; j<dates[i].months.length; j++)
                {
                    if(dates[i].months[j] != undefined)
                    {
                        newMonths.push(dates[i].months[j])
                    }
                }
                dates[i].months = newMonths;
            }

            result = {'categories':categories,'dates':dates,'lastPosts':lastPosts};
            if (categories.length>0)result['hasCategories']=true;
            if (dates.length>0)result['hasDates']=true;
            if (lastPosts.length>0)result['hasLastPosts']=true;
            return result;
        } catch (e) {
            util.log('Could not load counts: '+e);
            return {};
        }
    });
}

exports.counts = function () {
    return counts();
}

function attachmentUrl (docID, attachmentName) {
    if (settings.couchdb.user != undefined && settings.couchdb.password != undefined) {
        return 'http://'+settings.couchdb.user+':'+settings.couchdb.password+'@'+settings.couchdb.host+':'+settings.couchdb.port+'/'+settings.couchdb.db+'/'+docID+'/'+attachmentName;
    } else {
        return 'http://'+settings.couchdb.host+':'+settings.couchdb.port+'/'+settings.couchdb.db+'/'+docID+'/'+attachmentName;
    }
}

exports.attachmentUrl = function (docID, attachmentName) {
    return attachmentUrl(docID, attachmentName);
};

exports.attachmentUrlForMappedName = function (docID, mappedName) {
    return couchdb.get(docID).then(function(post) {
        var attachmentName = undefined;

        var attachments = post['attachments'];
        for (var i=0;i<attachments.length;i++) {
            var attachment=attachments[i];
            if (attachment['filename'] == mappedName) {
                attachmentName = attachment['attachment'];
                break;
            }
        }

        if (attachmentName == undefined) return attachmentUrl(docID, mappedName);
        return attachmentUrl(docID, attachmentName);
    });
};

exports.uuidFilename = function (filename) {
    return uuid.v4()+filename.substring(filename.length-4);
};
