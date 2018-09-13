function gup(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

var credentials = JSON.parse(localStorage.getItem('credentials'));
var oauthInLocation = (location.search.indexOf('oauth_token') > -1) && credentials === null;
if (!credentials && !oauthInLocation) {
  $('#login').show();
  var gupUrl = gup('url');
  if (gupUrl.indexOf('twitter.com') > -1) {
    $('#login').append(`<p>It looks like someone wants to share <a href="${gupUrl}">this Twitter thread</a> with you. You'll have to log in to see it. (This tool only asks for permissions to read tweets.)</p>`);
  }

}
// if we have an oauth token, get our access token and show our stuff
else if (oauthInLocation) {
  var url = "https://tinysubversions.com:8449/access-token" + location.search;
  //console.log('url:', url);
  $.get(url).done(function(user) {
    $('#userinfo').show();
    //console.log(user);
    credentials = {
      access_token: user.access_token,
      access_token_secret: user.access_token_secret,
      name: user.name,
      screen_name: user.screen_name,
      id_str: user.id_str
    };
    localStorage.setItem('credentials', JSON.stringify(credentials));
    $('#status').text("You've authenticated!");
    $('#profile').html("<p>" + user.name + ", @" + user.screen_name + "</p>");
    $('.nologin').hide();
    var gupUrl = gup('url');
    if (gupUrl.indexOf('twitter.com') > -1) {
      $('#url').val(gupUrl);
      spool();
    }
  });
}
else {
  $('#userinfo').show();
  $('.nologin').hide();
  $('#status').text("Welcome back to Spooler!");
  $('#profile').html("<p>" + credentials.name + ", @" + credentials.screen_name + ` &mdash; <a href="#!" class="logout">Logout</a></p>`);
  var gupUrl = gup('url');
  if (gupUrl.indexOf('twitter.com') > -1) {
    $('#url').val(gupUrl);
    spool();
  }
}

function spool() {
  window.history.replaceState(null, null, window.location.pathname);
  var tweet = $('#url').val();
  if (tweet.indexOf(`https://twitter.com/`) === 0) {
    $('.loader').show();
    $('#post').html('');
    $('#notice').show();
    var url = `https://tinysubversions.com:8449/spool?tweet=${tweet}&id=${credentials.id_str}&access_token=${credentials.access_token}&access_token_secret=${credentials.access_token_secret}`;
    //console.log(url);
    $.get(url).done(function(data) {
      $('.loader').hide();
      $('#notice').hide();
      $('#post').html(data.html);
      $('.share-container').show();
      $('#share').html(`<a href="https://twitter.com/share" class="twitter-share-button" data-url="https://tinysubversions.com/spooler/?url=${tweet}" data-text="I've spooled a thread!" data-lang="en">Tweet</a>`);
      $('#share-url').attr('href',`https://tinysubversions.com/spooler/?url=${tweet}`);
      if (twttr.widgets) {
        twttr.widgets.load();
      }
    });
  }
}

// button handlers
$(function() {
  $('#login > button').on('click', function() {
    var gupUrl = gup('url');
    var urlParam = '';
    if (gupUrl.indexOf('twitter.com') > -1) {
      urlParam = '?url='+gupUrl;
    }
    window.location.href = 'https://tinysubversions.com:8449/request-token'+urlParam;
  });

  $('.what').on('click', function() {
    $('#info').toggle();
  });

  $('.logout').on('click', function() {
    localStorage.removeItem('credentials');
    window.location = 'https://tinysubversions.com/';
  });

  $('#spool').on('click', spool);
});
