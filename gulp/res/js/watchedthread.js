function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function watchedthread(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;
    var locals_for_with = (locals || {});
    
    (function (watchedthread) {
      pug_mixins["watchedthread"] = pug_interp = function(thread){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv\u003E\u003Cdiv class=\"watched-thread\"\u003E\u003Cp\u003E \u003Cb\u003E\u002F" + (pug_escape(null == (pug_interp = thread.board) ? "" : pug_interp)) + "\u002F" + (pug_escape(null == (pug_interp = thread.postId) ? "" : pug_interp)) + "\u003C\u002Fb\u003E - " + (pug_escape(null == (pug_interp = thread.subject) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003Ca class=\"close\"\u003EX\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
};
pug_mixins["watchedthread"](watchedthread);
    }.call(this, "watchedthread" in locals_for_with ?
        locals_for_with.watchedthread :
        typeof watchedthread !== 'undefined' ? watchedthread : undefined));
    ;;return pug_html;}