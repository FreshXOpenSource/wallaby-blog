var bogart     = require('bogart')
  , couchdb    = require('./couchdb')
  , helper     = require('./helper')
  , installer  = require('./installer')
  , $          = require('jquery')
  , uuid       = require('node-uuid')
  , util       = require('util')
  , partials   = require('./partials');

try {
    var settings = require('../../../settings');
} catch (e) {
    util.log(__('Could not load settings.json'));
    return;
}

var viewEngine = bogart.viewEngine('mustache')
  , router     = bogart.router();

var origRespond = viewEngine.respond.bind(viewEngine);
viewEngine.respond = function(template, config) {
    if(config.locals == undefined) config.locals = {};
    config.locals.__ = helper.translator;
    return origRespond(template, config);
};
 
router.get('/', function(req) {
    return helper.posts(viewEngine, undefined, undefined, undefined, 1);
});

router.get('/page/:page', function(req) {
    return helper.posts(viewEngine, undefined, undefined, undefined, req.params.page);
});

router.get('/date/:year', function(req) {
    return helper.posts(viewEngine, req.params.year, undefined, undefined, 1);
});

router.get('/date/:year/page/:page', function(req) {
    return helper.posts(viewEngine, req.params.year, undefined, undefined, req.params.page);
});

router.get('/date/:year/:month', function(req) {
    return helper.posts(viewEngine, req.params.year, req.params.month, undefined, 1);
});

router.get('/date/:year/:month/page/:page', function(req) {
    return helper.posts(viewEngine, req.params.year, req.params.month, undefined, req.params.page);
});

router.get('/category/:category', function(req) {
    return helper.posts(viewEngine, undefined, undefined, req.params.category, 1);
});

router.get('/category/:category/page/:page', function(req) {
    return helper.posts(viewEngine, undefined, undefined, req.params.category, req.params.page);
});

router.get('/category/:category/date/:year', function(req) {
    return helper.posts(viewEngine, req.params.year, undefined, req.params.category, 1);
});

router.get('/category/:category/date/:year/page/:page', function(req) {
    return helper.posts(viewEngine, req.params.year, undefined, req.params.category, req.params.page);
});

router.get('/category/:category/date/:year/:month', function(req) {
    return helper.posts(viewEngine, req.params.year, req.params.month, req.params.category, 1);
});

router.get('/category/:category/date/:year/:month/page/:page', function(req) {
    return helper.posts(viewEngine, req.params.year, req.params.month, req.params.category, req.params.page);
});

if (settings.elasticsearch != undefined) {
    router.get('/search/:keyword', function(req) {
        return helper.search(viewEngine, req.params.keyword);
    });
}

router.get('/search/', function(req) {
    return bogart.redirect('/');
});

router.get('/powered', function(req) {
    return helper.config().then (function (locals) {
        locals['siteTitle'] = __('Powered by');

        return helper.counts().then(function(counts) {
            locals["counts"]=counts;

            return viewEngine.respond('powered.html', {locals:locals});
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/disclaimer', function(req) {
    return helper.config().then (function (locals) {
        locals['siteTitle'] = locals['title']+" | " + __("Disclaimer");

        return helper.counts().then(function(counts) {
            locals["counts"]=counts;

            return viewEngine.respond('disclaimer.html', {locals:locals});
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/images/:id/:attachment', function(req) {
    return bogart.proxy(helper.attachmentUrl(req.params.id, req.params.attachment));
});

router.get('/posts/:id/:attachment', function(req) {
    return helper.attachmentUrlForMappedName(req.params.id, req.params.attachment).then (function (url) {
        return bogart.proxy(url);
    });
});

router.get('/posts/:id', function(req) {
  return couchdb.get(req.params.id).then(function(post) {
    post = helper.preparePost(post);

    return helper.config().then(function(config) {
        locals=$.extend(config, post);
        locals['siteTitle'] = post['name'];

        return helper.counts().then(function(counts) {
            locals["counts"]=counts;

            return viewEngine.respond('post.html', {locals:locals,partials:partials.list});
            }, function (err) {
                return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
            });
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

// ADMIN ROUTINGS

router.get('/admin', function(req) {
    locals = {"adminSubtitle":__("Overview")};
    return viewEngine.respond('admin_overview.html', {locals:locals,layout:"admin_layout.html"});
});

router.get('/admin/config', function(req) {
    return bogart.redirect('/admin/config/settings');
});

router.get('/admin/config/settings', function(req) {
    return helper.config().then (function (config) {
        locals = {"adminSubtitle":__("Blog configuration"),"config":config};
        return viewEngine.respond('admin_config_settings.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/config/css', function(req) {
    return helper.config().then (function (config) {
        locals = {"adminSubtitle":__("Blog configuration"),"config":config};
        return viewEngine.respond('admin_config_css.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/config/disclaimer', function(req) {
    return helper.config().then (function (config) {
        locals = {"adminSubtitle":__("Blog configuration"),"config":config};
        return viewEngine.respond('admin_config_disclaimer.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/config/images', function(req) {
    locals = {"adminSubtitle":__("Blog configuration")};
    return viewEngine.respond('admin_config_images.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
});

router.get('/admin/config/extra', function(req) {
    return helper.config().then (function (config) {
        var images = [];
        for (var name in config['_attachments']) {
            if (name != 'favicon.ico' && name != 'titleImage.png') {
                images.push({'name':name});
            }
        }
        locals = {"adminSubtitle":__("Blog configuration"),"images":images};
        return viewEngine.respond('admin_config_extra.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/posts', function(req) {
    return helper.config().then (function (config) {
        return couchdb.view('blog/all_posts_by_date',{'descending':true}).then(function(res) {
            var posts = res['rows'].map(function(row) {
                    return helper.preparePost(row['value']);
                }
            );
            locals = {"adminSubtitle":__("Manage posts"),"posts":posts,"disqus_shortname":config['disqus_shortname']};
            return viewEngine.respond('admin_posts.html', {locals:locals,layout:"admin_layout.html"});
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/post/:id', function(req) {
    return bogart.redirect('/admin/post/'+req.params.id+'/settings');
});

router.get('/admin/post/:id/settings', function(req) {
  return couchdb.get(req.params.id).then(function(post) {
    locals = {"adminSubtitle":__("Manage post"),"post":post};

    return viewEngine.respond('admin_post_settings.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/post/:id/images', function(req) {
  return couchdb.get(req.params.id).then(function(post) {
    locals = {"adminSubtitle":__("Manage post"),"post":helper.preparePost(post)};
    return viewEngine.respond('admin_post_images.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/post/:id/segments', function(req) {
  return couchdb.get(req.params.id).then(function(post) {
    locals = {"adminSubtitle":__("Manage post"),"post":helper.preparePost(post)};

    return viewEngine.respond('admin_post_segments.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/segmentSkel/:type', function(req) {
    locals = {'number':'99'};
    locals["has"+req.params.type.substring(0,1).toUpperCase()+req.params.type.substring(1)]=true;

    return viewEngine.respond('admin_post_segments.html', {locals:locals,layout:'admin_segment.partial.html'});
});

adminSuccess = function(title, template)
{
    return function(post){
        locals = {"adminSubtitle":__(title),"post":helper.preparePost(post)};
        return viewEngine.respond('admin_post_' + template + '.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    };     
};

adminError = function()
{
    return function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    };
};

router.get('/admin/post/:id/attachments', function(req) {
  return couchdb.get(req.params.id).then(
        adminSuccess("Manage post", "attachments"), 
        adminError()
  );
});

router.get('/admin/post/:id/links', function(req) {
  return couchdb.get(req.params.id).then(function(post) {
    locals = {"adminSubtitle":__("Manage post"),"post":helper.preparePost(post)};

    return viewEngine.respond('admin_post_links.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":__("Unknown Error")}});
    });
});

router.get('/admin/post/:id/preview', function(req) {
    return helper.config().then (function (config) {
        return couchdb.get(req.params.id).then(function(post) {
            locals = {"adminSubtitle":"Manage post","post":helper.preparePost(post),"disqus_shortname":config['disqus_shortname']};

            return viewEngine.respond('admin_post_preview.html', {locals:locals,layout:"admin_layout.html",partials:partials.list});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

// ADMIN ACTIONS

router.get('/admin/installDesignDocument', function(req) {
    return installer.installDesignDoc().then(function () {
        return bogart.redirect('/admin/config');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/createDatabase', function(req) {
    return couchdb.createDatabase().then(function () {
        return bogart.redirect('/');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/config/settings', function(req) {
    var mergeDict = {};

    mergeDict.title = req.params.title;
    mergeDict.subtitle = req.params.subtitle;
    mergeDict.pagination = req.params.pagination;
    mergeDict.adminlink = req.params.adminlink;
    mergeDict.postsPerPage = req.params.postsPerPage;
    mergeDict.disqus_shortname = req.params.disqus_shortname;
    mergeDict.sidebar = req.params.sidebar;

    return couchdb.merge('config',mergeDict).then(function (res) {
        return bogart.redirect('/admin/config/settings');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/config/css', function(req) {
    var mergeDict = {};

    mergeDict.css = req.params.css;

    return couchdb.merge('config',mergeDict).then(function (res) {
        return bogart.redirect('/admin/config/css');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/config/disclaimer', function(req) {
    var mergeDict = {};

    mergeDict.disclaimer = req.params.disclaimer;

    return couchdb.merge('config',mergeDict).then(function (res) {
        return bogart.redirect('/admin/config/disclaimer');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/config/images', function(req) {
    return couchdb.uploadMultipleFiles('config', [
        {'name':'favicon.ico','content-type':'image/vnd.microsoft.icon','file':req.params.favicon_ico}
    ,   {'name':'titleImage.png','content-type':'image/png','file':req.params.titleImage_png}
    ]).then(function (){
        return bogart.redirect('/admin/config/images');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/config/extra', function(req) {
    var name = helper.uuidFilename(req.params.file);

    return couchdb.uploadFile('config',req.params.file,name).then(function (res) {
        return bogart.redirect('/admin/config/extra');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/config/extra/delete/:attachment', function(req) {
    return couchdb.deleteFile('config',req.params.attachment).then(function (res) {
        return bogart.redirect('/admin/config/extra');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/posts/create', function(req) {
    var now = new Date();
    var postedAt = [now.getFullYear(),now.getMonth()+1,now.getDate(),now.getHours(),now.getMinutes(),now.getSeconds()];
    var docID = uuid.v4();

    return couchdb.save({'_id':docID,'type':'post','categories':[],'postedAt':postedAt,"attachments":[],"images":[],"segments":[],"links":[],"published":false}).then(function (res) {
        return bogart.redirect('/admin/post/'+docID);
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/posts/publish/:id', function(req) {
    return couchdb.merge(req.params.id, {'published':true}).then(function (res) {
        return bogart.redirect('/admin/posts');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/posts/depublish/:id', function(req) {
    return couchdb.merge(req.params.id, {'published':false}).then(function (res) {
        return bogart.redirect('/admin/posts');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/posts/delete/:id', function(req) {
    return couchdb.merge(req.params.id, {'_deleted':true}).then(function (res) {
        return bogart.redirect('/admin/posts');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/post/:id/publish/:tab', function(req) {
    return couchdb.merge(req.params.id, {'published':true}).then(function (res) {
        return bogart.redirect('/admin/post/'+req.params.id+'/'+req.params.tab);
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/post/:id/depublish/:tab', function(req) {
    return couchdb.merge(req.params.id, {'published':false}).then(function (res) {
        return bogart.redirect('/admin/post/'+req.params.id+'/'+req.params.tab);
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/post/:id/settings', function(req) {
    var mergeDict = {};
    mergeDict.name = req.params.name;
    mergeDict.postedAt = req.params.postedAt.split(',').map(function (k){return parseInt(k)});
    mergeDict.categories = req.params.categories.replace(/,\s+/g,',').replace(/\s+,/g,',').replace(/^\s+|\s+$/g,'').split(',');

    return couchdb.merge(req.params.id,mergeDict).then(function (res) {
        return bogart.redirect('/admin/post/'+req.params.id+'/settings');
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/post/:id/links/delete/:num', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        var post = res;
        post["links"].splice(req.params.num,1);

        return couchdb.save(post).then(function(res) {
            return bogart.redirect('/admin/post/'+req.params.id+'/links');
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/post/:id/links/add', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        var post = res;
        post["links"].push({'name':req.params.name,'url':req.params.url});

        return couchdb.save(post).then(function(res) {
            return bogart.redirect('/admin/post/'+req.params.id+'/links');
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/post/:id/images/save', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        var post = res;

        for (var i in req.params) {
            if (i.indexOf('caption_')==0) {
                var caption = req.params[i];
                var num = parseInt(i.substring(8));
                post['images'][num]['caption']=caption;
            }
        }

        return couchdb.save(post).then(function(res) {
            return bogart.redirect('/admin/post/'+req.params.id+'/images');
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/post/:id/images/add', function(req) {
    return helper.resizeImage(req.params.file).then(function(file) {
        var name = helper.uuidFilename(req.params.file);

        return couchdb.get(req.params.id).then(function(res) {
            var post = res;
            post['images'].push({'attachment':name});

            return couchdb.save(post).then(function(res) {
                return couchdb.uploadFile(req.params.id,file,name).then(function (res) {
                    return bogart.redirect('/admin/post/'+req.params.id+'/images');
                }, function (err) {
                    return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
                });
            }, function (err) {
                return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
            });
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/post/:id/images/delete/:num', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        var post = res;
        var name = post['images'][req.params.num]['attachment'];
        post['images'].splice(req.params.num,1);
        var segments = post['segments'];
        for (var i in segments) {
            var segment = segments[i];

            thumbnails = segment["thumbnails"];
            if (thumbnails) {
                for (var j in thumbnails) {
                    var thumbnail = thumbnails[j];
                    if (thumbnail['image'] == name) thumbnail['image']='';
                }
            }

            image = segment["image"];
            if (image && image['image'] == name) image['image']='';
        }

        return couchdb.save(post).then(function(res) {
            return couchdb.deleteFile (req.params.id, name).then(function(res) {
                return bogart.redirect('/admin/post/'+req.params.id+'/images');
            });
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/post/:id/images/moveleft/:num', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        var post = res;
        var num = parseInt(req.params.num);
        var images = [];

        for (var i=0; i<num-1;i++) {
            images.push(post['images'][i]);
        }
        images.push(post['images'][num]);
        images.push(post['images'][num-1]);
        for (var i=num+1; i<post['images'].length;i++) {
            images.push(post['images'][i]);
        }

        post['images']=images;

        return couchdb.save(post).then(function(res) {
            return bogart.redirect('/admin/post/'+req.params.id+'/images');
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/post/:id/images/moveright/:num', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        var post = res;
        var num = parseInt(req.params.num);
        var images = [];

        for (var i=0; i<num;i++) {
            images.push(post['images'][i]);
        }
        images.push(post['images'][num+1]);
        images.push(post['images'][num]);
        for (var i=num+2; i<post['images'].length;i++) {
            images.push(post['images'][i]);
        }
    
        post['images']=images;

        return couchdb.save(post).then(function(res) {
            return bogart.redirect('/admin/post/'+req.params.id+'/images');
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/post/:id/segments', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        segments=[];
        for (var i in req.params) {
            if (i.indexOf('text_')==0) {
                var num = parseInt(i.substring(5));
                segments[num]={"text":req.params[i]};
            } else if (i.indexOf('html_')==0) {
                var num = parseInt(i.substring(5));
                segments[num]={"html":req.params[i]};
            } else if (i.indexOf('markdown_')==0) {
                var md = require("node-markdown").Markdown;
                var num = parseInt(i.substring(9));
                segments[num]={"markdown":req.params[i], "html":md(req.params[i])};
            } else if (i.indexOf('image_')==0) {
                var num = parseInt(i.substring(6));
                segments[num]={"image":req.params[i]};
            } else if (i.indexOf('thumbnails_')==0) {
                var nums = i.substring(11).split('_');
                var num=parseInt(nums[0]);
                var thumbnail=parseInt(nums[1]);

                if (segments[num]==undefined)segments[num]={"thumbnails":[]};

                if (req.params[i].length>0) {
                    var segment=segments[num];
                    segment["thumbnails"][thumbnail]={"image":req.params[i]};
                    segments[num]=segment;
                }
            }
        }

        var post = res;
        post['segments']=segments;

        return couchdb.save(post).then(function(res) {
            return bogart.redirect('/admin/post/'+req.params.id+'/segments');
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/post/:id/attachments/save', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        var post = res;

        for (var i in req.params) {
            if (i.indexOf('filename_')==0) {
                var filename = req.params[i];
                var num = parseInt(i.substring(9));
                post['attachments'][num]['filename']=filename;
            }
            if (i.indexOf('license_')==0) {
                var license = req.params[i];
                var num = parseInt(i.substring(8));
                post['attachments'][num]['license']=license;
            }
        }

        return couchdb.save(post).then(function(res) {
            return bogart.redirect('/admin/post/'+req.params.id+'/attachments');
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.post('/admin/post/:id/attachments/add', function(req) {
    var name = helper.uuidFilename(req.params.file);

    return couchdb.get(req.params.id).then(function(res) {
        var filename = req.params.file.replace(/^.*[\\\/]/, '');
        var post = res;
        post['attachments'].push({'attachment':name,'filename':filename});

        return couchdb.save(post).then(function(res) {
            return couchdb.uploadFile(req.params.id,req.params.file,name).then(function (res) {
                return bogart.redirect('/admin/post/'+req.params.id+'/attachments');
            }, function (err) {
                return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
            });
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

router.get('/admin/post/:id/attachments/delete/:num', function(req) {
    return couchdb.get(req.params.id).then(function(res) {
        var post = res;
        var name = post['attachments'][req.params.num]['attachment'];
        post['attachments'].splice(req.params.num,1);

        return couchdb.save(post).then(function(res) {
            return couchdb.deleteFile (req.params.id, name).then(function(res) {
                return bogart.redirect('/admin/post/'+req.params.id+'/attachments');
            });
        }, function (err) {
            return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
        });
    }, function (err) {
        return viewEngine.respond('posts.html', {locals:{"error":true,"message":"Unknown Error"}});
    });
});

process.on('uncaughtException', function (err) {
    util.log('Caught exception: ' + err);
});

exports.start = function () {
    var app = bogart.app();
    app.use(bogart.batteries);
    app.use(router);
    app.start(settings.listenPort);
}
