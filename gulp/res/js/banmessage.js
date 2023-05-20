function pug_attr(t,e,n,r){if(!1===e||null==e||!e&&("class"===t||"style"===t))return"";if(!0===e)return" "+(r?t:t+'="'+t+'"');var f=typeof e;return"object"!==f&&"function"!==f||"function"!=typeof e.toJSON||(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||-1===e.indexOf('"'))?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function banmessage(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;
    var locals_for_with = (locals || {});
    
    (function (__, banmessage) {
      pug_mixins["banmessage"] = pug_interp = function(banmessage){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cp class=\"ban\"\u003E\u003Cspan class=\"message\"\u003E" + (pug_escape(null == (pug_interp = __('USER WAS BANNED FOR THIS POST')) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E \u003Cspan" + (" class=\"reason\""+pug_attr("data-reason", banmessage, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = banmessage) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fp\u003E";
};
pug_mixins["banmessage"](banmessage);
    }.call(this, "__" in locals_for_with ?
        locals_for_with.__ :
        typeof __ !== 'undefined' ? __ : undefined, "banmessage" in locals_for_with ?
        locals_for_with.banmessage :
        typeof banmessage !== 'undefined' ? banmessage : undefined));
    ;;return pug_html;}