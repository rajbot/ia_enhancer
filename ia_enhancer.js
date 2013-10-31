(function() {
    //alert('foo!');

    var path = document.location.pathname.split('/');
    if (3 != path.length) {
        alert('could not find archive.org identifier');
        return;
    }


    var identifier = path[2];
    console.log('got id:', identifier)


    //make_meta_div()
    //____________________________________________________________________________________
    function make_meta_div(metadata, can_edit) {
        var meta_div = $('<div id="ia_meta_div"></div>');

        var system_metadata = ['addeddate', 'call_number', 'camera', 'collection',
                            'collectionid', 'contributor', 'curation',
                            'foldoutcount', 'identifier',
                            'identifier-access', 'identifier-ark', 'imagecount', 'lcamid',
                            'mediatype', 'missingpages', 'numeric_id', 'ocr', 'operator',
                            'page-progression', 'pick', 'ppi', 'publicdate', 'rcamid',
                            'repub_state', 'scandate', 'scanningcenter',
                            'scanner', 'sponsor', 'sponsordate',
                            'type', 'updatedate', 'updater', 'uploader'];

        var interesting_metadata = ['creator', 'credits', 'contributor', 'date', 'language',
            'notes', 'publisher', 'shotlist', 'sponsor', 'subject',
        ];

        var toplevel_metadata = ['title', 'description'];

        var keys = Object.keys(metadata);
        keys.sort();

        $.each(keys, function(i, key) {
            if (-1 === $.inArray(key, interesting_metadata))   return true; //continue
            if (-1 !== $.inArray(key, toplevel_metadata)) return true; //continue

            if ("object" === typeof(metadata[key])) return true; //for now


            var row_div = $('<div/>').addClass('ia_meta_row');
            var key_div = $('<div/>').addClass('ia_meta_key').text(key);
            if (-1 !== $.inArray(key, ['notes', 'shotlist'])) {
                var val_div = $('<div/>').addClass('ia_meta_val').html(metadata[key].trim().replace(/\n/g, '<br/>\n'));
            } else {
                var val_div = $('<div/>').addClass('ia_meta_val').text(metadata[key]);
            }
            meta_div.append(row_div.append(key_div).append(val_div));
        });

        $.each(keys, function(i, key) {
            if (-1 !== $.inArray(key, interesting_metadata))   return true; //continue
            if (-1 !== $.inArray(key, toplevel_metadata)) return true; //continue

            if ("object" === typeof(metadata[key])) return true; //for now

            var row_div = $('<div/>').addClass('ia_meta_row');
            var key_div = $('<div/>').addClass('ia_meta_key').text(key);
            var val_div = $('<div/>').addClass('ia_meta_val').text(metadata[key]);
            meta_div.append(row_div.append(key_div).append(val_div));
        });

        return meta_div;
    }

    // append_dl_files_group
    //____________________________________________________________________________________
    function append_dl_files_group(div, name) {
        var dl_group = $('<div/>').addClass('dl_group');
        div.append(dl_group);
        dl_group.append($('<div/>').addClass('dl_orig').text(name));
        var dl_files = $('<div/>').addClass('dl_files');
        dl_group.append(dl_files);
        return dl_files;
    }


    // append_metafiles()
    //____________________________________________________________________________________
    function append_metafiles(dl_div, data, identifier, can_edit) {
        var files = data['files'];
        var dl_files = append_dl_files_group(dl_div, 'Metadata');

        if (can_edit) {
            var link = $('<a/>').attr('href', '/history/'+identifier).text('History');
            dl_files.append($('<span/>').addClass('dl_file').append(link));
        }

        $.each(files, function(i, file) {
            if ('Metadata'  == file.format) {
                var type;
                if (/_meta.xml$/.test(file.name)) {
                    type = 'meta.xml';
                } else if (/_files.xml$/.test(file.name)) {
                    type = 'files.xml'
                } else if (/_reviews.xml$/.test(file.name)) {
                    return true; //continue
                } else {
                    type = file.name;
                }
                var link = $('<a/>').attr('href', '/download/'+identifier + '/' + file.name).text(type);
                dl_files.append($('<span/>').addClass('dl_file').append(link)).append(' ');
            }
        });

        var link = $('<a/>').attr('href', '/metadata/'+identifier).text('JSON');
        dl_files.append($('<span/>').addClass('dl_file').append(link));

        var all_files = append_dl_files_group(dl_div, 'All Files');
        var dir = data['dir'];
        if ('d1' in data) {
            link = $('<a/>').attr('href', 'https://'+data['d1']+dir).text('Primary');
            all_files.append($('<span/>').addClass('dl_file').append(link));
        }
        if ('d2' in data) {
            link = $('<a/>').attr('href', 'https://'+data['d2']+dir).text('Secondary');
            all_files.append($('<span/>').addClass('dl_file').append(link));
        }
        if (can_edit) {
            link = $('<a/>').attr('href', 'https://archive.org/upload?identifier='+identifier).text('Add file to this item');
            all_files.append($('<span/>').addClass('dl_file').append(link));
        }
    }


    // make_files_div()
    //____________________________________________________________________________________
    function make_files_div(data, can_edit) {
        var files    = data['files'];
        var metadata = data['metadata'];

        var identifier = metadata['identifier'];
        var files_div = $('<div id="ia_files_div"></div>');

        var collections = get_collections(metadata);
        if (-1 !== $.inArray('stream_only', collections)) {
            if (!can_edit) {
                return;
            } else {
                files_div.append('<div>This item is available in streaming format. Admin view of files:</div>');
            }
        }

        var downloads = {};
        $.each(files, function(i, file) {
            if ('Thumbnail' == file.format) return true; //continue
            if ('Metadata'  == file.format) return true; //continue

            var original;
            if ('derivative' == file.source) {
                original = file.original;
            } else {
                original = file.name;
            }
            if (!(original in downloads)) {
                downloads[original] = [];
            }
            var dl = {'format': file.format,
                      'name':   file.name,
                      'source': file.source,
                      }
            downloads[original].push(dl);
        });

        var dl_div = $('<div/>').addClass('ia_downloads');
        files_div.append(dl_div);

        append_metafiles(dl_div, data, identifier, can_edit);

        var keys = Object.keys(downloads);
        keys.sort();

        $.each(keys, function(i, key) {
            var dl_files = append_dl_files_group(dl_div, key);

            $.each(downloads[key], function(i, file) {
                var link = $('<a/>').attr('href', '/download/'+identifier + '/' + file.name).text(file.format);
                var dl_file = $('<span/>').addClass('dl_file').append(link);
                if ('original' == file.source) {
                    dl_file.addClass('ia_original');
                }
                dl_files.append(dl_file);
            });
        });

        return files_div;
    }


    // get_collections
    //____________________________________________________________________________________
    function get_collections(metadata) {
        var collections = metadata['collection'];
        if ("string" == typeof(collections)) {
            collections = [collections];
        }
        return collections;
    }

    // make_nav_div()
    //____________________________________________________________________________________
    function make_nav_div(metadata) {
        var mediatype = metadata['mediatype'];
        var logo = $('<img/>').attr('src', chrome.extension.getURL('logo.png')).addClass('ia_logo');
        var link = $('<a href="/">').append(logo);
        //var nav_str = '<img src="/images/logo.png" class="ia_logo"/></a> &#10095; ->';
        var nav_div = $('<div id="ia_nav_div"/>').append(link).append(' &#10095; ');
        link = $('<a/>').attr('href', '/details/'+mediatype).text(mediatype);
        nav_div.append(link);

        var collections = get_collections(metadata);

        $.each(collections.reverse(), function(i, collection) {
            if (collection == mediatype) return true; //etree items
            link = $('<a/>').attr('href', '/details/'+collection).text(collection);
            nav_div.append(' &#10095; ').append(link);
        });

        return nav_div;
    }


    // make_title_div()
    //____________________________________________________________________________________
    function make_title_div(metadata) {
        var title = metadata['title'];
        if (undefined == title) title = 'Untitled';

        var title_div = $('<div id="ia_title_div"/>').text(title);
        return title_div;
    }


    // make_description_div()
    //____________________________________________________________________________________
    function make_description_div(metadata, cls) {
        var identifier = metadata['identifier'];
        var description = metadata['description'];
        if (undefined === description) {
            description = '';
        }

        description = description.replace(/\n/g, '<br/>\n');
        var desc_div = $('<div/>').addClass(cls).addClass('ia_desc').html(description);
        desc_div.append($('<div/>').addClass('ia_reddit_links'));

        var script = document.createElement('script');
        script.textContent = 'function ia_reddit_callback(obj) {$.each(obj["data"]["children"], function (i, key) {$(".ia_reddit_links").append("<div class=\'ia_reddit_link\'><a href=\'http://reddit.com"+key["data"]["permalink"]+"\'>"+key["data"]["score"] + " points</a></div>");});}';
        document.head.appendChild(script);

        //Check for both http and https links
        $.ajax({
            url: 'https://pay.reddit.com/api/info.json?url='+encodeURIComponent('https://archive.org/details/'+identifier)+'&jsonp=ia_reddit_callback',
            dataType: 'jsonp',
        });

        $.ajax({
            url: 'https://pay.reddit.com/api/info.json?url='+encodeURIComponent('http://archive.org/details/'+identifier)+'&jsonp=ia_reddit_callback',
            dataType: 'jsonp',
        });

        return desc_div;
    }


    // make_book_div()
    //____________________________________________________________________________________
    function make_book_div(metadata, read_links) {
        var identifier = metadata['identifier'];
        var book_div = $('<div id="ia_book"/>');

        if(read_links.length > 0) {
            var stream_link = read_links.attr('href');
            if (/^\/stream\//.test(stream_link)) {
                var embed_div = $("<iframe id='bookreader_embed' onload='$(\"#bookreader_embed\")[0].contentWindow.jQuery(\"#BRnavCntlBtm\").click();' src='"+stream_link+"#mode/2up' width='100%' height='430px' frameborder='0' ></iframe>");
                book_div.append(embed_div);
            }
        }

        var desc_div = make_description_div(metadata, 'ia_book_description');
        book_div.append(desc_div);

        return book_div;
    }


    //draw_av_page()
    //____________________________________________________________________________________
    function draw_av_page(data, can_edit) {
        var metadata = data['metadata'];
        var files    = data['files'];

        var av_embed = $('#avplaycontainer');
        if (0 == av_embed.length) {
            console.log('could not find avplayer!');
            return;
        }

        var mediatype = metadata['mediatype'];
        var nav_div = make_nav_div(metadata);
        var title_div = make_title_div(metadata);

        var ia_player_div = $('<div id="ia_player_div"/>');
        var ia_div = $('<div id="ia_enhancer"/>');

        var meta_div = make_meta_div(metadata, can_edit);
        ia_div.append(meta_div);

        var files_div = make_files_div(data, can_edit);
        ia_div.append(files_div);


        if ('movies' !== mediatype) {
            $('#avplaydiv').addClass('ia_audio');
        }

        $('body').empty().append(nav_div).append(title_div).append(ia_player_div).append(ia_div);
        ia_player_div.append(av_embed);
        av_embed.on('resize', '#avplaydiv', function() {alert('resize');});

        var desc_div = make_description_div(metadata, 'ia_description');
        ia_player_div.append(desc_div);
        /*
        var description = metadata['description'];
        if (undefined != description) {
            description = description.replace(/\n/g, '<br/>\n');
            var desc_div = $('<div/>').addClass('ia_description').html(description);
            //meta_div.append(desc_div);
            ia_player_div.append(desc_div);
        }
        */

    }


    //draw_texts_page()
    //____________________________________________________________________________________
    function draw_texts_page(data, read_links, can_edit) {
        var metadata = data['metadata'];
        var files    = data['files'];

        var nav_div = make_nav_div(metadata);
        var title_div = make_title_div(metadata);

        var ia_div = $('<div id="ia_enhancer"/>');
        var meta_div = make_meta_div(metadata, can_edit);
        ia_div.append(meta_div);

        var files_div = make_files_div(data, can_edit);
        ia_div.append(files_div);

        var book_div = make_book_div(metadata, read_links);

        $('body').empty().append(nav_div).append(title_div).append(book_div)

        $('body').append(ia_div);


    }


    //____________________________________________________________________________________
    $.get('/metadata/'+identifier, function(data) {
        //$('body').empty();

        var metadata  = data['metadata'];
        var mediatype = metadata['mediatype'];

        var can_edit = false;
        if (1 == $('a.level3Header').filter(':contains("Edit Item!")').length) {
            can_edit = true;
        }

        if (-1 !== $.inArray(mediatype, ['movies', 'audio', 'etree'])) {
            draw_av_page(data, can_edit);
        } else if ('texts' == mediatype) {
            var read_links = $('#dl a').filter(':contains("Read Online")');
            draw_texts_page(data, read_links, can_edit);
        }
    });
})();
