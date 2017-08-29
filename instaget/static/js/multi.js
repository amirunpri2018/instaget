var users_posts_dict = {}; // dict of dict, so as insertion, search and deltetion is of O(1) complexity
var selected_media = [];
var requests = false; // helps in reseting all parameters in re-search
var selected_media_set = false;

// Embed all posts using IG oembed endpoint
function IGembed(shortcode){
    post_link = 'https://instagram.com/p/' + shortcode;
    $.ajax({
        url: 'https://api.instagram.com/oembed/?url=' + post_link,
        type: 'GET',
        crossDomain: true,
        dataType:'jsonp',
        async: false,
        success: function(data) {
            console.log(data);
            if(users_posts_dict[data['author_name']] == undefined){
                users_posts_dict[data['author_name']] = {};
            }
            users_posts_dict[data['author_name']][shortcode] = 1;
            var html = `<div class="card" style="max-width: 20rem;">`
                        + data['html']
                    + `</div>`;
            $('#results').append(html);
            window.instgrm.Embeds.process() // Note: no semi colon
        },
        error: function(request, status, error){
          console.log(request['status']);
          if(request['status']==500){
            $('#error-msg').html('Internal Server Error! please try after some time.');
          }else{
          $('#error-msg').html('Post not found!, please enter a valid link.');
          }
          $('.alert').show();
        }

    });

}


function setMediaLinks(){
    console.log('Preparing selected_media, calling Ajax');
    console.log(users_posts_dict);
    $.ajax({
        url: '/getMultiPosts/',
        type: 'POST',
        data: {'users_posts_dict': JSON.stringify(users_posts_dict),
                csrfmiddlewaretoken: csrf_token },
        success: function(posts) {
            console.log("Got ajax response from views", posts);
            if(posts.length==0){
                $('#error-msg').html('Posts not found!');
                $('.alert').show();
            }else{
                var carousel, tmp;
                for(var i in posts){ // i is shortcode
                    // console.log(posts[i]['type']);
                    if (posts[i]['type']=="image"){
                        selected_media.push(posts[i]['images']['low_resolution']['url']);
                    }else if(posts[i]['type']=='video'){
                        selected_media.push(posts[i]['videos']['low_resolution']['url']);
                    }else {//carousel
                        carousel = posts[i]['carousel_media'];
                        for(var j in carousel){
                            // console.log(carousel[j]['type']);
                            if(carousel[j]['type']=='image'){
                                // console.log(carousel[j]['images']['low_resolution']['url']);
                                tmp = carousel[j]['images']['low_resolution']['url'];
                            }else{
                                tmp = carousel[j]['videos']['low_resolution']['url'];
                                // console.log(carousel[j]['videos']['low_resolution']['url']);
                            }
                            // console.log(tmp);
                            selected_media.push(tmp);
                        }
                    }
                }
                console.log("media links set");
                console.log(selected_media);
                // $('#function-buttons').css('display','block');
            }
            //below 2 lines useful only for initial search
            $('#submit').removeAttr('disabled');
            $('#submit').html("Go");
            $('#downloadButton').show();
        },
        error: function(request, status, error){
          console.log(request['status']);
          if(request['status']==500){
            $('#error-msg').html('Internal Server Error! please try after some time.');
          }else{
          $('#error-msg').html('User not found!, please enter a valid username.');
          }
          $('.alert').show();
          $('#submit').removeAttr('disabled');
          $('#submit').html("Go");
        },
    });

}
function getMultiPosts(shortcodes){
    $('#submit').attr('disabled','disabled');   
    $('#submit').html("<img src='/static/ajax-loader.gif'> Go");
    requests = true;
    $('#results').html('');
    var users_posts_dict = {};
    for (var i in shortcodes){
        IGembed(shortcodes[i]);
    }
}


// when all ajax functions are done then.
$(document).ajaxStop(function () {
    if(!selected_media_set){
        setMediaLinks();
        selected_media_set = true;
    }
    console.log('ajaxStop');
    return;
});


$('#submit').click( function(e) {
    e.preventDefault();
    if(requests){ // User is re-searching, re-initialize every global var
        requests = false;
        links_count = 0;
        selected_media = [];
        selected_media_set = false;
        users_posts_dict = {};
        $('#results').html('');
        $('#downloadButton').hide();
    }
    $('.alert').hide(); // there may be some initial alert, even though requests!=0
    links = $('#multi_post_links').val();
    shortcodes = getShortCodes(links);
    console.log(shortcodes);
    getMultiPosts(shortcodes);
    return;
});


function getShortCodes(links){
    links = links.replace(/[\t\f\v]/g, '').split('\n');//remove any white space, split by \n
    // re = new RegExp('/p/(.*)/');
    re = /\/p\/([^\/]+)\//;
    var link_list = [];
    for(var i in links){
        if(links[i].slice(-1)!='/') links[i]+='/';
        if(re.test(links[i])){
            link_list.push(links[i].match(re)[1]);
        }
    }
    return link_list;
}


function closeAlert(){
    $('.alert').hide();
    $('#error-msg').html('');
}