function pug_attr(t,e,n,r){if(!1===e||null==e||!e&&("class"===t||"style"===t))return"";if(!0===e)return" "+(r?t:t+'="'+t+'"');var f=typeof e;return"object"!==f&&"function"!==f||"function"!=typeof e.toJSON||(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||-1===e.indexOf('"'))?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)(s=pug_classes(r[g]))&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;
function pug_style(r){if(!r)return"";if("object"==typeof r){var t="";for(var e in r)pug_has_own_property.call(r,e)&&(t=t+e+":"+r[e]+";");return t}return r+""}function post(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (Date, post) {pug_mixins["report"] = pug_interp = function(r){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv class=\"reports post-container\"\u003E\u003Cinput" + (" class=\"post-check\""+" type=\"checkbox\" name=\"checkedreports\""+pug_attr("value", r.id, true, false)) + "\u002F\u003E\t\u003Cspan\u003EDate: " + (pug_escape(null == (pug_interp = r.date.toLocaleString()) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E \u003Cspan\u003EReason: " + (pug_escape(null == (pug_interp = r.reason) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E";
};
pug_mixins["post"] = pug_interp = function(post, truncate, manage=false, globalmanage=false, ban=false){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv" + (" class=\"anchor\""+pug_attr("id", post.postId, true, false)) + "\u003E\u003C\u002Fdiv\u003E\u003Carticle" + (pug_attr("class", pug_classes([`post-container ${post.thread || ban === true ? '' : 'op'}`], [true]), false, false)) + "\u003E";
const postURL = `/${post.board}/thread/${post.thread || post.postId}.html`;
pug_html = pug_html + "\u003Cheader class=\"post-info\"\u003E\u003Clabel\u003E";
if (globalmanage) {
pug_html = pug_html + "\u003Cinput" + (" class=\"post-check\""+" type=\"checkbox\" name=\"globalcheckedposts\""+pug_attr("value", post._id, true, false)) + "\u002F\u003E";
}
else
if (!ban) {
pug_html = pug_html + "\u003Cinput" + (" class=\"post-check\""+" type=\"checkbox\" name=\"checkedposts\""+pug_attr("value", post.postId, true, false)) + "\u002F\u003E";
}
pug_html = pug_html + "\t";
if (!post.thread) {
if (post.sticky) {
pug_html = pug_html + "\u003Cimg src=\"\u002Fimg\u002Fsticky.png\" height=\"12\" width=\"12\" title=\"Sticky\"\u002F\u003E ";
}
if (post.bumplocked) {
pug_html = pug_html + "\u003Cimg src=\"\u002Fimg\u002Fbumplocked.png\" height=\"12\" width=\"12\" title=\"Bumplocked\"\u002F\u003E ";
}
if (post.locked) {
pug_html = pug_html + "\u003Cimg src=\"\u002Fimg\u002Flocked.png\" height=\"12\" width=\"12\" title=\"Locked\"\u002F\u003E ";
}
if (post.cyclic) {
pug_html = pug_html + "\u003Cimg src=\"\u002Fimg\u002Fcyclic.png\" height=\"13\" width=\"13\" title=\"Cyclic\"\u002F\u003E ";
}
}
if (post.subject) {
pug_html = pug_html + "\u003Cspan class=\"post-subject\"\u003E" + (pug_escape(null == (pug_interp = post.subject) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E ";
}
if (post.email) {
pug_html = pug_html + "\u003Ca" + (pug_attr("href", `mailto:${post.email}`, true, false)) + "\u003E\u003Cspan class=\"post-name\"\u003E" + (pug_escape(null == (pug_interp = post.name) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fa\u003E";
}
else {
pug_html = pug_html + "\u003Cspan class=\"post-name\"\u003E" + (pug_escape(null == (pug_interp = post.name) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
pug_html = pug_html + " ";
if (post.country && post.country.code) {
pug_html = pug_html + "\u003Cspan" + (pug_attr("class", pug_classes([`flag flag-${post.country.code.toLowerCase()}`], [true]), false, false)+pug_attr("title", post.country.name, true, false)+pug_attr("alt", post.country.name, true, false)) + "\u003E\u003C\u002Fspan\u003E ";
}
if (post.tripcode) {
pug_html = pug_html + "\u003Cspan class=\"post-tripcode\"\u003E" + (pug_escape(null == (pug_interp = post.tripcode) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E ";
}
if (post.capcode) {
pug_html = pug_html + "\u003Cspan class=\"post-capcode\"\u003E" + (pug_escape(null == (pug_interp = post.capcode) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E ";
}
const postDate = new Date(post.date)
pug_html = pug_html + "\u003Ctime" + (" class=\"post-date\""+pug_attr("datetime", postDate.toISOString(), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = postDate.toLocaleString("en-US", { hour12:false, timeZone: "America/New_York" })) ? "" : pug_interp)) + "\u003C\u002Ftime\u003E ";
if (post.userId) {
pug_html = pug_html + "\u003Cspan" + (" class=\"user-id\""+pug_attr("style", pug_style(`background-color: #${post.userId}`), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = post.userId) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E ";
}
pug_html = pug_html + "\u003C\u002Flabel\u003E\u003Cspan class=\"post-links\"\u003E\u003Ca" + (" class=\"no-decoration\""+pug_attr("href", `${postURL}#${post.postId}`, true, false)) + "\u003ENo.\u003C\u002Fa\u003E\u003Cspan class=\"post-quoters\"\u003E\u003Ca" + (" class=\"no-decoration\""+pug_attr("href", `${postURL}#postform`, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = post.postId) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
if (!post.thread) {
pug_html = pug_html + " \u003Cspan\u003E\u003Ca" + (pug_attr("href", `${postURL}#postform`, true, false)) + "\u003E[Reply]\u003C\u002Fa\u003E\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003C\u002Fheader\u003E\u003Cdiv class=\"post-data\"\u003E";
if (post.files.length > 0) {
pug_html = pug_html + "\u003Cdiv class=\"post-files\"\u003E";
// iterate post.files
;(function(){
  var $$obj = post.files;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var file = $$obj[pug_index0];
pug_html = pug_html + ("\u003Cdiv class=\"post-file\"\u003E\u003Cspan class=\"post-file-info\"\u003E\u003Cspan\u003E\u003Ca" + (pug_attr("href", '/img/'+file.filename, true, false)+pug_attr("title", 'Download '+file.originalFilename, true, false)+pug_attr("download", file.originalFilename, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = post.spoiler ? 'Spoiler File' : file.originalFilename) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fspan\u003E\u003Cbr\u002F\u003E\u003Cspan\u003E (" + (pug_escape(null == (pug_interp = file.sizeString) ? "" : pug_interp)) + ", " + (pug_escape(null == (pug_interp = file.geometryString) ? "" : pug_interp)));
if (file.durationString) {
pug_html = pug_html + (", " + (pug_escape(null == (pug_interp = file.durationString) ? "" : pug_interp)));
}
pug_html = pug_html + ")\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003Cdiv" + (" class=\"post-file-src\""+pug_attr("data-type", file.mimetype.split('/')[0], true, false)) + "\u003E\u003Ca" + (" target=\"_blank\""+pug_attr("href", `/img/${file.filename}`, true, false)) + "\u003E";
if (post.spoiler) {
pug_html = pug_html + "\u003Cimg class=\"file-thumb\" src=\"\u002Fimg\u002Fspoiler.png\" width=\"128\" height=\"128\"\u002F\u003E";
}
else
if (file.hasThumb) {
pug_html = pug_html + "\u003Cimg" + (" class=\"file-thumb\""+pug_attr("src", `/img/thumb-${file.hash}${file.thumbextension}`, true, false)+pug_attr("height", file.geometry.thumbheight, true, false)+pug_attr("width", file.geometry.thumbwidth, true, false)) + "\u002F\u003E";
}
else {
pug_html = pug_html + "\u003Cimg" + (" class=\"file-thumb\""+pug_attr("src", `/img/${file.filename}`, true, false)+pug_attr("height", file.geometry.height, true, false)+pug_attr("width", file.geometry.width, true, false)) + "\u002F\u003E";
}
pug_html = pug_html + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var file = $$obj[pug_index0];
pug_html = pug_html + ("\u003Cdiv class=\"post-file\"\u003E\u003Cspan class=\"post-file-info\"\u003E\u003Cspan\u003E\u003Ca" + (pug_attr("href", '/img/'+file.filename, true, false)+pug_attr("title", 'Download '+file.originalFilename, true, false)+pug_attr("download", file.originalFilename, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = post.spoiler ? 'Spoiler File' : file.originalFilename) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fspan\u003E\u003Cbr\u002F\u003E\u003Cspan\u003E (" + (pug_escape(null == (pug_interp = file.sizeString) ? "" : pug_interp)) + ", " + (pug_escape(null == (pug_interp = file.geometryString) ? "" : pug_interp)));
if (file.durationString) {
pug_html = pug_html + (", " + (pug_escape(null == (pug_interp = file.durationString) ? "" : pug_interp)));
}
pug_html = pug_html + ")\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003Cdiv" + (" class=\"post-file-src\""+pug_attr("data-type", file.mimetype.split('/')[0], true, false)) + "\u003E\u003Ca" + (" target=\"_blank\""+pug_attr("href", `/img/${file.filename}`, true, false)) + "\u003E";
if (post.spoiler) {
pug_html = pug_html + "\u003Cimg class=\"file-thumb\" src=\"\u002Fimg\u002Fspoiler.png\" width=\"128\" height=\"128\"\u002F\u003E";
}
else
if (file.hasThumb) {
pug_html = pug_html + "\u003Cimg" + (" class=\"file-thumb\""+pug_attr("src", `/img/thumb-${file.hash}${file.thumbextension}`, true, false)+pug_attr("height", file.geometry.thumbheight, true, false)+pug_attr("width", file.geometry.thumbwidth, true, false)) + "\u002F\u003E";
}
else {
pug_html = pug_html + "\u003Cimg" + (" class=\"file-thumb\""+pug_attr("src", `/img/${file.filename}`, true, false)+pug_attr("height", file.geometry.height, true, false)+pug_attr("width", file.geometry.width, true, false)) + "\u002F\u003E";
}
pug_html = pug_html + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fdiv\u003E";
}
let truncatedMessage = post.message;
if (post.message) {
if (truncate) {
const splitPost = post.message.split('\n');
const messageLines = splitPost.length;
if (messageLines > 10) {
	truncatedMessage = splitPost.slice(0, 10).join('\n');
} else if (post.message.length > 1000) {
	truncatedMessage = post.message.substring(0,1000).replace(/<([\w]+)?([^>]*)?$/, '');
}
pug_html = pug_html + "\u003Cpre class=\"post-message\"\u003E" + (null == (pug_interp = truncatedMessage) ? "" : pug_interp) + "\u003C\u002Fpre\u003E";
}
else {
pug_html = pug_html + "\u003Cpre class=\"post-message\"\u003E" + (null == (pug_interp = post.message) ? "" : pug_interp) + "\u003C\u002Fpre\u003E";
}
}
if (!post.message && post.files.length === 0) {
pug_html = pug_html + "\u003Cp\u003EPost files unlinked\u003C\u002Fp\u003E";
}
if (post.banmessage) {
pug_html = pug_html + "\u003Cp class=\"banmessage\"\u003EUSER WAS BANNED FOR THIS POST " + (pug_escape(null == (pug_interp = post.banmessage ? `(${post.banmessage})` : '') ? "" : pug_interp)) + "\u003C\u002Fp\u003E";
}
if (truncatedMessage !== post.message) {
pug_html = pug_html + "\u003Cdiv class=\"cb mt-5 ml-5\"\u003EMessage too long. \u003Ca" + (pug_attr("href", `${postURL}#${post.postId}`, true, false)) + "\u003EView the full text\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E";
}
if (post.omittedposts || post.omittedfiles) {
pug_html = pug_html + "\u003Cdiv class=\"cb mt-5 ml-5\"\u003E";
const ompo = post.omittedposts;
const omfi = post.omittedfiles;
pug_html = pug_html + (pug_escape(null == (pug_interp = ompo) ? "" : pug_interp)) + " repl" + (pug_escape(null == (pug_interp = ompo > 1 ? 'ies' : 'y') ? "" : pug_interp)) + "\n" + (pug_escape(null == (pug_interp = omfi > 0 ? ` and ${omfi} image${omfi > 1 ? 's' : ''}` : '') ? "" : pug_interp)) + " omitted. \n\u003Ca" + (pug_attr("href", `${postURL}#${post.postId}`, true, false)) + "\u003EView the full thread\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E";
}
if (post.previewbacklinks && post.previewbacklinks.length > 0) {
pug_html = pug_html + "\u003Cdiv class=\"replies mt-5 ml-5\"\u003EReplies: ";
// iterate post.previewbacklinks
;(function(){
  var $$obj = post.previewbacklinks;
  if ('number' == typeof $$obj.length) {
      for (var pug_index1 = 0, $$l = $$obj.length; pug_index1 < $$l; pug_index1++) {
        var backlink = $$obj[pug_index1];
pug_html = pug_html + "\u003Ca" + (" class=\"quote\""+pug_attr("href", `/${post.board}/thread/${post.thread || post.postId}.html#${backlink.postId}`, true, false)) + "\u003E&gt;&gt;" + (pug_escape(null == (pug_interp = backlink.postId) ? "" : pug_interp)) + "\u003C\u002Fa\u003E ";
      }
  } else {
    var $$l = 0;
    for (var pug_index1 in $$obj) {
      $$l++;
      var backlink = $$obj[pug_index1];
pug_html = pug_html + "\u003Ca" + (" class=\"quote\""+pug_attr("href", `/${post.board}/thread/${post.thread || post.postId}.html#${backlink.postId}`, true, false)) + "\u003E&gt;&gt;" + (pug_escape(null == (pug_interp = backlink.postId) ? "" : pug_interp)) + "\u003C\u002Fa\u003E ";
    }
  }
}).call(this);

if (post.previewbacklinks.length < post.backlinks.length) {
const ombls = post.backlinks.length-post.previewbacklinks.length;
pug_html = pug_html + "+ \u003Ca" + (pug_attr("href", `${postURL}#${post.postId}`, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = ombls) ? "" : pug_interp)) + " earlier\u003C\u002Fa\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
}
else
if (post.backlinks && post.backlinks.length > 0) {
pug_html = pug_html + "\u003Cdiv class=\"replies mt-5 ml-5\"\u003EReplies: ";
// iterate post.backlinks
;(function(){
  var $$obj = post.backlinks;
  if ('number' == typeof $$obj.length) {
      for (var pug_index2 = 0, $$l = $$obj.length; pug_index2 < $$l; pug_index2++) {
        var backlink = $$obj[pug_index2];
pug_html = pug_html + "\u003Ca" + (" class=\"quote\""+pug_attr("href", `/${post.board}/thread/${post.thread || post.postId}.html#${backlink.postId}`, true, false)) + "\u003E&gt;&gt;" + (pug_escape(null == (pug_interp = backlink.postId) ? "" : pug_interp)) + "\u003C\u002Fa\u003E ";
      }
  } else {
    var $$l = 0;
    for (var pug_index2 in $$obj) {
      $$l++;
      var backlink = $$obj[pug_index2];
pug_html = pug_html + "\u003Ca" + (" class=\"quote\""+pug_attr("href", `/${post.board}/thread/${post.thread || post.postId}.html#${backlink.postId}`, true, false)) + "\u003E&gt;&gt;" + (pug_escape(null == (pug_interp = backlink.postId) ? "" : pug_interp)) + "\u003C\u002Fa\u003E ";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Farticle\u003E";
if (manage === true) {
// iterate post.reports
;(function(){
  var $$obj = post.reports;
  if ('number' == typeof $$obj.length) {
      for (var pug_index3 = 0, $$l = $$obj.length; pug_index3 < $$l; pug_index3++) {
        var r = $$obj[pug_index3];
pug_mixins["report"](r);
      }
  } else {
    var $$l = 0;
    for (var pug_index3 in $$obj) {
      $$l++;
      var r = $$obj[pug_index3];
pug_mixins["report"](r);
    }
  }
}).call(this);

}
if (globalmanage === true) {
// iterate post.globalreports
;(function(){
  var $$obj = post.globalreports;
  if ('number' == typeof $$obj.length) {
      for (var pug_index4 = 0, $$l = $$obj.length; pug_index4 < $$l; pug_index4++) {
        var r = $$obj[pug_index4];
pug_mixins["report"](r);
      }
  } else {
    var $$l = 0;
    for (var pug_index4 in $$obj) {
      $$l++;
      var r = $$obj[pug_index4];
pug_mixins["report"](r);
    }
  }
}).call(this);

}
};
pug_mixins["post"](post);}.call(this,"Date" in locals_for_with?locals_for_with.Date:typeof Date!=="undefined"?Date:undefined,"post" in locals_for_with?locals_for_with.post:typeof post!=="undefined"?post:undefined));;return pug_html;}