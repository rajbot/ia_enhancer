(function() {
    //alert('foo!');
    console.log($('.key'));

    var path = document.location.pathname.split('/');
    if (3 != path.length) {
        alert('could not find archive.org identifier');
        return;
    }


    var identifier = path[2];
    console.log('got id:', identifier)

    //append_metadata()
    //____________________________________________________________________________________
    function append_metadata(metadata, meta_div) {
        console.log('append!');
        var system_metadata = ['addeddate', 'call_number', 'camera', 'collection',
                            'collectionid', 'contributor', 'curation',
                            'foldoutcount', 'identifier',
                            'identifier-access', 'identifier-ark', 'imagecount', 'lcamid',
                            'mediatype', 'missingpages', 'numeric_id', 'ocr', 'operator',
                            'page-progression', 'pick', 'ppi', 'publicdate', 'rcamid',
                            'repub_state', 'scandate', 'scanningcenter',
                            'scanner', 'sponsor', 'sponsordate',
                            'type', 'updatedate', 'updater', 'uploader'];

        var toplevel_metadata = ['title', 'description'];

        var keys = Object.keys(metadata);
        keys.sort();

        $.each(keys, function(i, key) {
            if (-1 !== $.inArray(key, system_metadata))   return true; //continue
            if (-1 !== $.inArray(key, toplevel_metadata)) return true; //continue

            if ("object" === typeof(metadata[key])) return true; //for now

            var row_div = $('<div/>').addClass('meta_row');
            var key_div = $('<div/>').addClass('meta_key').text(key);
            var val_div = $('<div/>').addClass('meta_val').text(metadata[key]);
            meta_div.append(row_div.append(key_div).append(val_div));
        });

        $.each(keys, function(i, key) {
            if (-1 === $.inArray(key, system_metadata))   return true; //continue
            if (-1 !== $.inArray(key, toplevel_metadata)) return true; //continue

            if ("object" === typeof(metadata[key])) return true; //for now

            var row_div = $('<div/>').addClass('meta_row');
            var key_div = $('<div/>').addClass('meta_key').text(key);
            var val_div = $('<div/>').addClass('meta_val').text(metadata[key]);
            meta_div.append(row_div.append(key_div).append(val_div));
        });

        /*


        for (key in metadata) {
            if ('description' == key) continue;
            console.log(key);
            console.log(metadata[key]);

            var row_div = $('<div/>').addClass('meta_row');
            var key_div = $('<div/>').addClass('meta_key').text(key);
            var val_div = $('<div/>').addClass('meta_val').text(metadata[key]);
            meta_div.append(row_div.append(key_div).append(val_div));
        }
        */
    }


    // append_metafiles()
    //____________________________________________________________________________________
    function append_metafiles(av_div, files, identifier) {
        var dl_group = $('<div/>').addClass('dl_group');
        av_div.append(dl_group);
        dl_group.append($('<div/>').addClass('dl_orig').text('Metadata'));
        var dl_files = $('<div/>').addClass('dl_files');
        dl_group.append(dl_files);
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
                dl_files.append($('<span/>').addClass('dl_file').append(link));
            }
        });

        var link = $('<a/>').attr('href', '/metadata/'+identifier).text('JSON');
        dl_files.append($('<span/>').addClass('dl_file').append(link));
    }


    // append_files()
    //____________________________________________________________________________________
    function append_files(files, av_div, identifier) {
        var downloads = {};
        $.each(files, function(i, file) {
            console.log(file);
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
        av_div.append(dl_div);

        console.log('downloads:');
        console.log(downloads);

        append_metafiles(dl_div, files, identifier);

        var keys = Object.keys(downloads);
        keys.sort();

        $.each(keys, function(i, key) {
            var dl_group = $('<div/>').addClass('dl_group');
            dl_div.append(dl_group);
            dl_group.append($('<div/>').addClass('dl_orig').text(key));
            var dl_files = $('<div/>').addClass('dl_files');
            dl_group.append(dl_files);

            $.each(downloads[key], function(i, file) {
                console.log('file');
                console.log(file);
                var link = $('<a/>').attr('href', '/download/'+identifier + '/' + file.name).text(file.format);
                var dl_file = $('<span/>').addClass('dl_file').append(link);
                if ('original' == file.source) {
                    dl_file.addClass('ia_original');
                }
                dl_files.append(dl_file);
            });
        });

    }


    //draw_movie_page()
    //____________________________________________________________________________________
    function draw_movie_page(metadata, files) {
        console.log('drawing movie page');
        var av_embed = $('#avplaycontainer');
        if (0 == av_embed.length) {
            console.log('could not find avplayer!');
            return;
        }

        var title = metadata['title'];
        if (undefined == title) title = 'Untitled';
        var ia_div = $('<div id="ia_enhancer"/>');
        var title_div = $('<div id="title_div"/>').text(title);
        var meta_div = $('<div id="meta_div"></div>');

        var ia_player_div = $('<div id="ia_player_div"/>');

        var mediatype = metadata['mediatype'];
        if ('audio' == mediatype) {
            $('#avplaydiv').addClass('ia_audio');
        }

        $('body').empty().append(title_div).append(ia_player_div).append(ia_div);
        ia_player_div.append(av_embed);
        ia_div.append(meta_div);
        av_embed.on('resize', '#avplaydiv', function() {alert('resize');});

        var description = metadata['description'];
        if (undefined != description) {
            var desc_div = $('<div/>').addClass('ia_description').text(description);
            //meta_div.append(desc_div);
            ia_player_div.append(desc_div);
        }

        append_metadata(metadata, meta_div);

        var files_div = $('<div id="ia_files_div"></div>');
        ia_div.append(files_div);

        append_files(files, files_div, metadata['identifier']);
    }

    //____________________________________________________________________________________
    $.get('/metadata/'+identifier, function(data) {
        console.log('got:'); console.log(data);
        //$('body').empty();

        var metadata  = data['metadata'];
        var files     = data['files'];
        var mediatype = metadata['mediatype'];
        if (('movies' == mediatype) || ('audio' == mediatype)){
            draw_movie_page(metadata, files);
        }
    });
})();