### 0.3.4
  - Minor bugfix, saving board settings with empty custom CSS was incorrectly returning an error if there were global filters for css.

### 0.3.3
  - Minor bugfix to filenames of expanded images being incorrectly truncated in some circumstances, when "image loading bars" is enabled.

### 0.3.2
  - Minor bugfix to post moving.

### 0.3.1
  - Small board list optimisation, no longer try to fetch webring site names if webring not enabled.
  - Make webring blacklisting also apply to endpoints after being fetched, in case the URL is different (alt domain, onions, etc).
  - Webring.json and site names cache is now removed when webring is disabled.
  - More reasonable webring timeout for fetching each site.
  - Webring bugfixes.

### 0.3.0
  - Ban durations are now editable. Staff can set a new ban duration (starting from the current date, not the original ban issue date).
  - Minor bugfixes.

### 0.2.0
  - From now on, versioning = major.minor.patch. significant changes = major, feature updates = minor, bugfixes/small stuff = patch.
  - Update instructions about nginx changes when upgrading.
  - Add an endpoint for getting the csrf token separately from html pages. See API docs for more details.
  - Add post "marking" so moved/deleted posts info is sent over websocket. Frontend will handle them. Deleted threads and moved OPs will now also disconnect the socket and remove the post form.
  - Block bypasses are now locked to where they were created (anonymizer or clearnet) to prevent some forms of 'smuggling'. This will be improved further in upcoming releases.
  - Code highlighting now supports all highlight.js languages when explicitly specified. The whitelist now only applies to auto-detection, as originally intended.
  - Quotes for post references in modlog now have the proper quote class, and will show when hovered like any other quote.
  - Bugfixes
  - [jschan-docs](http://fatchan.gitgud.site/jschan-docs/):
    - API docs improvements, now includes csrf token, posting, post actions (and mod variants), and more. It should be enough documentation for somebody to write a mobile app integration.
  - [globalafk](https://gitgud.io/fatchan/globalafk/) (my fork):
    - On android with termux, tapping the notification will open the post (in mod view) and the notification has new shortcut buttons to quickly delete, delete+ban or delete+global ban.

### 0.1.10
  - Add thread watcher/watchlist, so users can save list of threads to a little window and see unread count
  - There are now API docs available at http://fatchan.gitgud.site/jschan-docs/
  - Improved installation nginx script. Confirms overwriting and doesnt break when run more than once
  - Some visual tweaks (file "(u)" being on newline, "x" -> "×")
  - Bugfixes

### 0.1.9
  - Fix "improved" global settings changes not regenerating custom pages properly
  - Postmenu dropdown for filters/moderate added to catalog tiles
  - Notifications are no longer sent for posts when clicking "view full text"
  - Make handling files with no/incorrect extension better
  - Image count from OP is included in catalog tiles file count

### 0.1.8
  - Much improved nginx configuration for installation, script does most of the work
  - Fixed settings form asking to save password -.-
  - Multiple files & post flags now shown in catalog view
  - Faster, more efficient global settings changes
  - Add option for board owner to prevent OP deleting threads that are too old or have too many replies

### 0.1.7
  - Update inconsistent wording of custom overboard subtitle from 0.1.6
  - Dont show "local first" checkbox in boardlist when webring isn't even enabled
  - Bugfix to code markup, remove only leading blank lines, keeping leading whitespace on first non-empty line
  - Make overboard settings save somewhat in localstorage to help stupid zoomers who dont know what a BOOKMARK is

#### 0.1.6
  - Mongodb v5 and node driver v4 update
  - IP rangebans use more reasonable range for ipv6
  - Fix ip randomising schedule
  - Global announcements now show on overboard (both views)
  - Overboard upgrade, now users can set to add and remove any boards, global setting to enable/disable. Form is collapsible
  - Add an extra "new reply" button to the end of threads for convenience
  - Users with scripts will now see proper video thumbnails (depending on browser supported codecs) in the upload list
  - Make fuzzy image hash option and hashes visible to globals, for filtering
  - Add board option to enable reverse image search link next to filenames
  - Add board option to enable an external "archive" link with the other nav links
  - Add global option to configure the URL for archive/reverse image serach links
  - Improved API for some global moderation interfaces, to allow more custom integration to reports and more
  - Staff who hide their name from public logs will also be hidden in the ban when shown to banned user
  - Image previews now shown in notifications
  - Strict filtering improvements
  - Many bugfixes

#### 0.1.5
  - Try to fallback thumbnail generation for video with horribly broken encoding
  - Country blocklist now can actually fit all countries
  - Make "auth level" text box into "account type" dropdown in accounts page, easier to understand
  - Board owners can now edit custom pages
  - Board owners can now manage custom assets
  - Show a little message and disable reply form on full threads (hit reply limit)
  - Allow longer language names for code blocks
  - User settings import and export option

#### 0.1.4
  - Banner uploading bugfix

#### 0.1.3
  - Script optimizations, improves page load speed especially on longer threads
  - Extra (u) download link for no reason
  - favicon, webmanifest, browserconfig, etc for browsers made into gulp task
  - Webring now sends and checks for ppd stat
  - Board search improved (prefix matches)
  - Update code for form submission and data validation, faster and easier to maintain
  - Make it more obvious to users with a blacklisted IP if block bypass dnsbl is enabled
  - Add new themes
  - Improved README
  - Many bugfixes

#### 0.1.2
  - Merge webring and local board list and improve webring search and filter functionality
  - New stat section of homepage
  - Replaced and removed some fatchan-specific media
  - Fixed undefined hcaptcha site key bug
  - Updated README with info about nginx CSP for 3rd party captcha providers
  - Update socket-io 2.x to 4.x

#### 0.1.1
  - Added changelog
  - Version now changes with some kind of meaning
  - Animated gif thumbnails no longer generate static image for images < thumbnail dimensions
  - Boards management "Banners" page is now "Assets"
  - Boards can have custom flags
