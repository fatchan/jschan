function pug_attr(t,e,n,r){if(!1===e||null==e||!e&&("class"===t||"style"===t))return"";if(!0===e)return" "+(r?t:t+'="'+t+'"');var f=typeof e;return"object"!==f&&"function"!==f||"function"!=typeof e.toJSON||(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||-1===e.indexOf('"'))?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function uploaditem(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;
    var locals_for_with = (locals || {});
    
    (function (uploaditem) {
      pug_mixins["uploaditem"] = pug_interp = function(item){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv\u003E\u003Cdiv class=\"upload-item\"\u003E\u003Cimg" + (" class=\"upload-thumb\""+pug_attr("src", item.url, true, false)) + "\u002F\u003E\u003Cp\u003E" + (pug_escape(null == (pug_interp = item.name) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003Ca class=\"close\"\u003E×\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E";
if (item.hash) {
pug_html = pug_html + "\u003Cdiv class=\"row sb\"\u003E";
if (item.spoilers) {
pug_html = pug_html + "\u003Clabel\u003E\u003Cinput" + (" type=\"checkbox\" name=\"spoiler\""+pug_attr("value", item.hash, true, false)) + "\u002F\u003ESpoiler\u003C\u002Flabel\u003E";
}
if (item.stripFilenames) {
pug_html = pug_html + "\u003Clabel\u003E\u003Cinput" + (" type=\"checkbox\" name=\"strip_filename\""+pug_attr("value", item.hash, true, false)) + "\u002F\u003EStrip Filename\u003C\u002Flabel\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
};
pug_mixins["uploaditem"](uploaditem);
    }.call(this, "uploaditem" in locals_for_with ?
        locals_for_with.uploaditem :
        typeof uploaditem !== 'undefined' ? uploaditem : undefined));
    ;;return pug_html;}