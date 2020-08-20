function pug_attr(t,e,n,r){if(!1===e||null==e||!e&&("class"===t||"style"===t))return"";if(!0===e)return" "+(r?t:t+'="'+t+'"');var f=typeof e;return"object"!==f&&"function"!==f||"function"!=typeof e.toJSON||(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||-1===e.indexOf('"'))?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function captchaformsection(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;
    var locals_for_with = (locals || {});
    
    (function (googleRecaptchaEnabled, googleRecaptchaSiteKey) {
      pug_mixins["captchaformsection"] = pug_interp = function(){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Csection class=\"row\"\u003E\u003Cdiv class=\"label\"\u003E\u003Cspan\u003ECaptcha\u003Cspan class=\"required\"\u003E*\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"col\"\u003E";
if (googleRecaptchaEnabled) {
pug_html = pug_html + "\u003Cdiv" + (" class=\"g-recaptcha captchafield\""+pug_attr("data-sitekey", `${googleRecaptchaSiteKey}`, true, false)+" data-theme=\"dark\" data-size=\"compact\" data-callback=\"recaptchaCallback\"") + "\u003E\u003C\u002Fdiv\u003E";
}
else {
pug_html = pug_html + "\u003Cnoscript class=\"no-m-p\"\u003E\u003Ciframe" + (" class=\"captcha\""+" src=\"\u002Fcaptcha.html\""+pug_attr("width=210", true, true, false)+" height=\"80\" scrolling=\"no\" loading=\"lazy\"") + "\u003E\u003C\u002Fiframe\u003E\u003C\u002Fnoscript\u003E\u003Cdiv class=\"jsonly captcha\" style=\"display:none;\"\u003E\u003C\u002Fdiv\u003E\u003Cinput" + (" class=\"captchafield\""+" type=\"text\" name=\"captcha\" autocomplete=\"off\" placeholder=\"Captcha text\" pattern=\".{6}\""+pug_attr("required", true, true, false)+" title=\"6 characters\"") + "\u002F\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fsection\u003E";
};
pug_mixins["captchaformsection"]();
    }.call(this, "googleRecaptchaEnabled" in locals_for_with ?
        locals_for_with.googleRecaptchaEnabled :
        typeof googleRecaptchaEnabled !== 'undefined' ? googleRecaptchaEnabled : undefined, "googleRecaptchaSiteKey" in locals_for_with ?
        locals_for_with.googleRecaptchaSiteKey :
        typeof googleRecaptchaSiteKey !== 'undefined' ? googleRecaptchaSiteKey : undefined));
    ;;return pug_html;}