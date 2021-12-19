function pug_attr(t,e,n,r){if(!1===e||null==e||!e&&("class"===t||"style"===t))return"";if(!0===e)return" "+(r?t:t+'="'+t+'"');var f=typeof e;return"object"!==f&&"function"!==f||"function"!=typeof e.toJSON||(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||-1===e.indexOf('"'))?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)(s=pug_classes(r[g]))&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;function watchedthread(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;
    var locals_for_with = (locals || {});
    
    (function (watchedthread) {
      pug_mixins["watchedthread"] = pug_interp = function(thread){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv" + (" class=\"row watched-thread\""+pug_attr("data-id", `${thread.board}-${thread.postId}`, true, false)+pug_attr("data-unread", (thread.unread||null), true, false)) + "\u003E\u003Ca class=\"close\"\u003E×\u003C\u002Fa\u003E";
const watchedThreadLink = `/${thread.board}/thread/${thread.postId}.html`;
pug_html = pug_html + "\u003Ca" + (pug_attr("class", pug_classes([(thread.isCurrentThread ? 'bold' : '')], [true]), false, false)+pug_attr("href", watchedThreadLink, true, false)) + "\u003E\u002F" + (pug_escape(null == (pug_interp = thread.board) ? "" : pug_interp)) + "\u002F - " + (pug_escape(null == (pug_interp = thread.subject || 'No subject') ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003Ca" + (" class=\"ml-a\""+pug_attr("href", `${watchedThreadLink}#bottom`, true, false)) + "\u003E[▼]\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E";
};
pug_mixins["watchedthread"](watchedthread);
    }.call(this, "watchedthread" in locals_for_with ?
        locals_for_with.watchedthread :
        typeof watchedthread !== 'undefined' ? watchedthread : undefined));
    ;;return pug_html;}