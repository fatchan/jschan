### 1.7.0
  - Important permission logic changes. Technical explanation:
    - If an account is a board owner or board staff, they will only get the permissions that are under the `_MANAGE_BOARD_BITS` if the "Board Owner" or "Board Staff" roles respectively have the permission ticked, AND its ticked in the board staff permissions.
    - Roles for "Board owner" and "Board staff" are now separate from "Board staff defaults" and "Board owner defaults". The defaults are the bits set by default on board owners/board staff, and the regular roles define the maximum permissions that board owners or staff can have. This allows more global control over what permissions BOs/staff can have and what BOs can delegate to their staff.
    - The "applyInheritance" function has been modified to not set all _MANAGE_BOARD_BITS for a BO unconditionally anymore, see the previous point.
    - This means admins can e.g. uncheck permissions on the "Board Owner"/"Board Staff" role globally to control what BOs and staff can access, or to prevent BOs delegating certain permissions to their staff, but still give it back on a per-account basis.
    - Accounts who are e.g. "Global Staff" who have those permissions on their role (happens before the board calculation), or have it set at an account level will still have those perms, so removing them from the role or being a board staff and a "Global Staff" or having "Board Owner" role at an account level doesn't break their permissions.
  - On global accounts management, add the ability to see who has 2FA enabled.
  - Add image embed support in posts (requires a permission), added to faq page "post styling" section.
  - When getting redirected for lack of authentication specifically to "/manage/thread/" paths, just redirect to the public version, rather than to /login.
    - Makes it easier for staff to share links to threads without having to remove "/manage" from the URL.
    - Logged out staff can just press "manage" in the top corner on the public page to get sent to /login with a ?goto query param for the thread anyway.
  - Make the appearance of the video play button more consistent across OS/devices and not display as an emoji on IOS.
  - Update the digi theme.
  - Improve global settings form validation to prevent enabling webring without some othre required fields being set.
  - Update docs and jschan-api-go with the "global clear" endpoint.
  - Update INSTALLATION.md and various other components to make install work reliably again.

### 1.6.2
  - Bugfix for "replace" filters not replacing all occurences of matches in some circumstances
  - Update dependencies & npm audit fix

### 1.6.1
  - Fixed a regression causing some video/audio file thumbnails to be blank or to be incorrectly rejected as corrupt.
  - Fixed a bug breaking the global bans page.
  - Translation updates thanks to @l29utp0 from ptchan.org.
    - Added Spanish locale.
    - Add new/missing translations to other locale files.
    - Fix some untranslated strings in the frontend templates.

### 1.6.0
  - Filters now have a "replace" mode, by @disco.
  - Global bans now show the board it originated from as "Global (<board>)".
  - Added a permission that allows board staff to see global bans in the board ban list if the ban was issued from a post on that board.
  - Modlogs now have private entries for staff auditing
    - So far covers creating boards, changing settings (board or global), and ban editing/unban/upgrade.
    - Modlog entries for e.g. board creation are global and not linked to the board and will not be deleted along with the board (duh).
    - Private modlogs for edited global bans will also be available from the originating board.
  - Global account management now has an option delete all boards owned by an account when deleting it.
  - Bugfix moving posts to non existing board not correctly returning an error sometimes.
  - Add "playsinline" attribute to expanded videos to prevent IOS defaulting them to fullscreen, thanks @l29utp0.
  - Styling tweaks to prevent showing a white background in the overscroll space on IOS, thanks to l29utp0.
  - Fixed a bug where in certain circumstances a thread would be sent to the last page when a reply is deleted.

### 1.5.0
  - Thanks very much to @disco and @some_random_guy for valuable contributions for this release while I have been busy and on vacation.
  - Remove spamhaus ZEN from the default included DNSBLs.
  - Improved handling of video thumbnailing with transparent vp8 and vp9 codecs.
    - Video codec now included in processedFile data.
  - Fix frontend bug of hovering quotes on some global/manage pages.
  - Added a tool to restore deleted posts from a backup.
  - Fix issue with scheduled file pruning.
  - Fix minor issue of text wrapping on board tables.
  - Update vendorised dependencies (gm, express-fileupload, etc).
  - Add a few more eslint rules to more strictly enforce code style.
  - No longer exlude the tools folder from linting.
  - Npm audit fix.

### 1.4.1
  - Update the INSTALLATION.md (install instructions).
  - Add a "Bypass DNSBL" account/role permission.
  - Add a "Bypass Anonymizer Restrictions" account/role permission.
  - Update dependencies.
  - Npm audit fix.

### 1.4.0
  - Add a new global management feature to clear all blockbypasses or all login sessions.
  - Make (You)s sync over multiple tabs when posting or clearing.
  - Update dependencies.
  - Npm audit fix.

### 1.3.3
  - Fix the "Board Defaults" section in globamanagement settings being inaccessible, and update the template to be slightly more maintainable (especially for forks).
  - Make the message box focused by js when a page is opened with #postform.
  - Fix an installation issue with a folder not getting created properly.

### 1.3.2
  - Global management board list links now link to boards in manage mode.
  - Bugfix live editing posts, when editing last post of a thread it no longer
    moves to the top of a thread.
  - pt-PT and pt-BR language improvements.
  - Styling tweaks to web3 signatures.
  - Update jschan-docs.
  - Npm audit.

### 1.3.1
  - Pt language fixes and updates.
  - Fix a bug in live posts not displaying web3 address/signatures.

### 1.3.0
  - Web3 integration with MetaMask, development generously funded by @0xBekket
    - Users with the MetaMask browser extension can now register/login to accounts, and sign their messages with MetaMask.
    - Signed post messages will display a signature and link to their wallet at the bottom of the post.
    - The link uses etherscan by default but can be changed to another url with %s substituting the address, like other URL settings.
    - A board-level and global option is available to disable web3 features.
    - `signature` and `address` are available as new properties on signed posts through the API.
    - No third party server communication or details are required for signing messages or authing.
    - This is a very exciting feature with a lot of possibilities for expanding in future. Stay tuned.
  - Client side filters can now be applied against flags or custom flags.
  - Fix order of Tegaki upload so files come before replays so catalog shows the thumbnail.
  - Video embeds now support youtube shorts and odysee.com.
  - New global option for URI decoding filenames, to display some characters such as quotation mark (") better in filenames.
  - Minor pt-PT language fixes.
  - Small color adjustments to Yotsuba theme to match 4chan colors more closely.
  - Update nginx config for new embeds in CSP, and some more file type support.
  - Npm audit.

### 1.2.2
  - Add a global setting to try and URI decode filenames
  - Minor pt-PT and pt-BR language fixes
  - Remove some unused dependencies
  - Npm audit

### 1.2.1
  - Bugfix ban upgrades not applying correctly due to bans format change.

### 1.2.0
  - Massive filter system overhaul, huge thanks to @disco.
    - Filters are no longer just a text box with some options that apply to all filters.
    - Filters can now be created/edited/deleted on separate global and board pages.
    - All previous filter options e.g. strict matching, ban/block mode, ban message, ban duration, and appealability are customisable per-filter.
    - The PR for this, #532 on gitgud is an excellent example of how to add features to jschan and fits into the design patterns perfectly.
    - This gives the flexibility to add a filter "replace" mode in a future release.
  - Added Italian locale (it-IT) courtesy of @zocram from niuchan.org
  - Improved Portuguese translations thanks to @l29utp0 from ptchan.org
  - Improved Russian translations thanks to Kusankot
  - Minor addition to INSTALLATION.md for those using Ubuntu rather than Debian.
  - Npm audit & dependencies updated.

### 1.1.1
  - Bugfix live post updates triggering the disconnect and removal of postforms on non-OP delete/move.
  - Improve text wrapping on long table data.
  - Npm audit.

### 1.1.0
  - Posts edits and "USER WAS BANNED FOR THIS POST" messages will now be updated live through the websocket.
  - Added Yandex Smart Captcha support, as an additional captcha type option.
    - NOTE: This is still a WIP because Yandex does not support registration from my country and I am unable to get an API key. If you are able to share an API key for development purposes, please reach out via contact detaiils in README.md
  - Fix pluralisation of thread stickying message.
  - Fix some language mixups in translations.

### 1.0.6
  - Bugfix in translation of blocked country message when posting.
  - Some Improvements to the Russian translation courtesy of an anon from bbs.quietplace.xyz. Handling of the complex plural rules in Russian will be improved in a future version.
  - Npm audit.

### 1.0.5
  - Add pt-BR language pack, by @thugking from Rchan.
  - Fix bypass not auto closing and submitting on non english locale.
  - Actually fix Tor hidden service country name not displaying correctly.
  - Make the error handling for "possible corrupt or unsupported file" catch more bad files and processing errors.
  - Make animated webp thumbnailing at least work and not give the above error (not supporting animated thumbs like .gif yet).
  - Add "ttf" extension to nginx snippets because some themes include fonts.
  - Reorganize <input> styling, use accent-color property on <input> elements, by @disco.
  - Add globalmanage setting for board default language.
  - Fix an issue with the referer because of translation, and prevent invalid settings for it from breaking the web panel.
  - Fix broken migration for board defaults causing language issues on newly created boards after updating from pre 1.0.0.
  - Npm audit.

### 1.0.4
  - Translation improvements.
  - Fix Tor hidden service country name not displaying correctly.
  - Make global disabling of anonymizer file posting apply to board banners, flags, custompages.

### 1.0.3
  - Translation improvements.
  - Add back missing "Lock+Unlist" mode for handling ianctive boards.
  - Npm audit.

### 1.0.2
  - Translation improvements.

### 1.0.1
  - Translation improvements.
  - Add a link to board in mod view e.g. /test/ on globalmanage recent posts to give some context.
  - Fix dockerignore for docker testing/development, was broken due to translations.

### 1.0.0
Version 1.0.0 is here. jschan is stable and mature enough and has been for a while. There's no need to go to version 0.9999.9999 and I am comfortable enough to call it "Version 1".
Of course, that doesn't mean jschan is perfect or finished by any means. I want to keep improving jschan and there are plenty of new features and changes planned for versions 2, 3, and beyond.
Thank you so much to all the jschan site admins, users & contributors for your help along the way. Your contributions have been invaluable to making this software great.
Special shoutout to l29utp0 & loynet (ptchan.org), Homicide (94chan.org) and some_random_guy (trashchan.xyz).

-Tom

Now, back to the program. Here are the changes for 1.0.0:
  - **Multiple language support.**

jschan now supports language packs. There is a global and board-level language setting which completely translates the interface to another language. Using server side rendering and logic, so it remains noscript compatible.
An effort has been made to translate everything, but given there is almost 4 years of code, some things may have slipped through the cracks. If something isn't translated, please report it on gitgud.
    
1.0.0 includes three* complete language packs:
  - English (en-GB)
  - Portuguese (pt-PT)
  - Russian (ru-RU) *Machine translated, may not be accurate.

Huge credit to the ptchan.org admins for providing the Portuguese translation.
Contributions for new language packs or improvements to existing ones are very welcome! **Reach out via email, IRC, or session (See README.md) to discuss imbursement for contributing language packs.**
Note: "global" pages e.g. overboards will adhere to global language setting. In a future iteration, these will be updated to (optionally, with global setting) support adhering to users browser language header for better UX going between a non-global language board and global pages.

  - Notify the user when making a playlist from a thread if there were no files, rather than just silently logging.
  - Improves the css and markup to only show the appropriate wording e.g "tap" or "click" in tooltips depending if you are on mobile/desktop.
  - Improve the installation process to fix a potential issue with the database connection settings.
  - Customflags will now show correctly when editing a post on a board with custom flags enabled.
  - Security improvement to the 2FA validation flow during login.
  - Log a few more errors related to hcaptcha/recaptcha, for debugging purposes. (already caught and returned in a friendly manner)
  - Remove showing language and relevance data when auto detecting highlighted code block language.
  - Add more themes (cybhub, digi, favela, ptchan, teletext).
  - More minor bugfixes to permissions pages displays.

### 0.11.4
  - Bugfix for the message stating how many banners were deleted when deleting banners.
  - Add an option to limit the total resolution of an image/video (width*height).

### 0.11.3
  - Fix max vs total upload count in controller for uploading board assets, flags and banners.
  - Move css theme assets to themes/assets instead of all lumped in one folder.
  - Adjust the letter spacing and line spacing of the 2FA QR code.

### 0.11.2
  - Convert the assets page form handling to the newer checkSchema code.
  - Don't show the "Edit" option in the post dropdowns for public pages.
  - No longer apply permissions inheritance after editing to prevent confusion.
  - Improve duplicate checking when editing roles to only explicitly match updated roles rather than applying inheritance first.
  - Bugfix "my permission" page not displaying correctly and board staff permission editing not applying.
  - Improve required parent permission display to show "requires X" in the tooltip of disabled checkboxes.

### 0.11.1
  - Bugfix non logged in users not able to use actions because of an issue in move post logic (thanks @some_random_guy).
  - Bugfix editing posts from the actions form (not the new dropdown "Edit" button) always redirecting to OP.

### 0.11.0
  - Improve the fallback behaviour of live posts to work on connect_error instead of only reconnect_failed, and also attempt to upgrade again to the socket.
  - The post form in modview now shows the full email field even with "sage only email", same as how the name field shows in modview with "force anon"
  - Globals or users who are staff on multiple boards can move posts between boards
  - IP/ban type display and suffixes improved to make IPv4/6/Bypass/Pruned IP clearer for more informed moderation.
  - Post editing is now available as a link in the post dropdown, and makes a GET for the page (like editcustompage/editnews)
  - Labelled link format markdown now supports mailto.
  - "Hide name" set by default when using public actions form.
  - Bugfix saveoverboard script so it works on catalog instead of only index, and improve the code to be more general and allow /catalog.html in navbar link.
  - Bugfix BYPASS_CAPTCHA permission not able to be applied to roles.
  - Add a small note on global account/role permission editing about the implication of setting "board management" permissions globally.
  - Update README with some new related projects and change demo/test instance to 94chan.
  - Globalmanage roles are now available in json format in the API.
  - Improve some of the templates and refactor some repetitive bits into includes/mixins.
  - Add and update some tests.
  - Npm audit & dependencies updated.
  - Buon Natale e buon anno 🎉

### 0.10.2
  - Bugfix to 2fa, code-reuse prevention was blocking all codes rather than only a recently used correct code.

### 0.10.1
  - Minor nginx configuration change for twofactor.html.

### 0.10.0
  - Add account two factor authenticaiton (TOTP).
  - Update dependencies.

### 0.9.4
  - Ability to add internal notes to bans. These are only seen by staff and not shown to the banned user.
  - Wordfilter auto bans will set an internal note with which wordfilter was triggered.
  - Fix zooming in on tabbed settings pages breaking when zoomed in on some browsers.
  - Npm audit fix.

### 0.9.3
  - Vastly improve installation instructions & automated nginx configuration.

### 0.9.2
  - Bugfix an issue with bypasses/captcha related to difference between renewing vs getting new bypass.

### 0.9.1
  - Allow customisable font for grid captcha.
  - Default grid captcha to a common system font instead of bundling an enormous 24MB font file.
  - Bugfix some tegaki issues.

### 0.9.0
  - Add board option to hide banners from header and link in board nav bar.
  - Add global option to remove reverse image search links from the overboard.
  - Tegaki now supports replay upload and playback.
  - Completing /bypass.html form will now renew your existing bypass if you had one.
  - Replaced "no subject" with #postId in several places.
  - New public API endpoints
    - Public board logs.
    - Board banners (previously undocumented).
    - Board custompages.
    - Select board settings and global settings (ones that are useful/necessary for 3rd party app integration).
  - Bugfix log pruning not removing old logs from mod view logs page (public log pages were unaffected and hid the old logs).
  - Bugfix deleting board assets/banners returning the wrong number in the success message.

### 0.8.2
  - Migrate to new socket.io redis adapter package.
  - Fix issue with pre checking boxes in ban modal conflicting with grid captcha.

### 0.8.1
  - Fix incorrectly displaying inactive accounts action settings in global settings.
  - Fix captcha gridv2 not appearing in board captcha slot with js enabled.

### 0.8.0
  - Settings pages are now more organised and use tabs, and still works without javascript. 
  - Captcha improvements
    - New captcha image effects, and customisation for their value/strength.
    - Customisable font for text captcha.
    - Improved grid captcha, the character sets and question are now customisable.
    - Added new captcha type "grid v2" with a different challenge involving pointing arrows. Also customisable like grid v1.
  - Added a new account level permission to bypass captchas including blockbypass.
  - Anonymizers dummy bypass cookies given while blockbypass is disabled are no longer valid once blockbypass is enabled.
  - Add a new option for automatically forfeiting board staff position and/or deleting inactive accounts with customisable time.
  - Add a new option to automatically lock, lock+unlist, or delete boards that have no board owner.
  - Homepage hot threads have a new option for maximum thread age, and are no longer bound to a static 7 days.
  - Homepage hot threads score formula is now `score=replies in last 7 days*(1-(current thread age/max thread age))` to better represent more recently active threads, rather than simply sorting by reply count.
  - Add unofficial Typescript SDK + typings for jschan api to README, (thanks to Michell/ussaohelcim).
  - Add "playlist" button in OP dropdown to download thread audio/video as m3u playlist (thanks to Michell/ussaohelcim).
  - Switch youtube embeds to use youtube-nocookie domain.

### 0.7.3
  - Bugfix some captcha generations causing server error due non-integer argument to randomRange.

### 0.7.2
  - Add playlist generating bookmarklet script to README
  - Bugfix some captcha generations causing server error due to bad random number range.
  - Fix UTF8-filenames not being decoded corectly (busboy made this not the default in a recent update).

### 0.7.1
  - Show sticky level on hover (title property) of pin icon.
  - Reduce frontend script size by ~10KB. More improvement to come in future updates.
  - Change homepage hot threads to show creation date rather than last bumped.
  - Don't allow setting global limit for post password length below what the frontend automatically generates.
  - When strict mime validation is enabled, actually tell the user what the server thinks the mime is in the mismatch error message.
  - Make IP pruning schedule also apply to modlogs.
  - Fix incorrectly hiding "create board"/"register an account" on account page because of permission issue.
  - Fix the nginx configuration script putting commas in CSP if you say yes to recaptcha/hcaptcha.
  - Fix recaptcha/hcaptcha causing an issue for scrolling to new posts in some (chrom*) browsers.
  - Fix the generate-favicon gulp task not versioning correctly causing cache issues.
  - Small frontend and backend refactors.
  - Add screenshot image animated with light/dark theme in README.
  - Publish some dependencies to npmjs for faster installation.
  - Update dependencies.

### 0.7.0
  - ESLint has been added as a dev dependency. This does "linting" to enforce code style and find and fix some mistakes.
  - Updated CONTRIBUTING.md information.
  - Bugfixes.

### 0.6.6
  - Post editing bugfix.

### 0.6.5
  - Portrait mode support for tegaki, improves the experience particularly on mobile devices.
  - Small refactor of filtering.
  - Modlog pruning now only deletes log entries older than the specified date when new modlogs are added, as originally intended.
  - Add a few extra things to server logs when debugLogs is true.
  - Minor bugfixes.

### 0.6.4
  - Add "adaptive" theme that switches between "clear" and "tomorrow" based on the device system theme, using prefers-color-scheme media query.
  - Minor bugfixes.

### 0.6.3
  - Bugfix when setting empty board tags, and other multiline settings.

### 0.6.2
  - Hotfix webring.

### 0.6.1
  - +/- button to expand a thread and see the omitted posts from index pages.
  - Option for global filter bans to be not appealable.

### 0.6.0
  - Bans+Appeal form will now appear in the modal popup when js enabled, instead of a dodgy workaround which often caused posting bugs and broke over Tor.
  - Bans can now be "upgraded" retroactively to expand single IP bans to qrange/hrange bans.
  - Ban table now shows columns for "Type" (IP/Bypass/Pruned) and "Range" (Single/Narrow/Wide).
  - Global setting to show some popular threads from listed boards on the homepage, with adjustible limit (0=disabled) and threshold. (courtesy ptchan.org)
  - Big refactor of backend, the awfully named and disorganised "helpers" is now the more appropriately named and better organised "lib".
  - Some form and input handling code made more robust based on test feedback.
  - More tests.
  - Bugfixes.

### 0.5.3
  - Add testing framework. Allows to test individual code, simulated requests and check for regressions after changes. Will be made more comprehensive over time.
  - Make "Manage" navbar link go to the current page in modview, instead of defaulting to reports page.
  - Fix some obscure bugs with incorrect post ordering/pages not rebuilding after making a post, or submitting post actions.
  - Many bugfixes.

### 0.5.2
  - Fix regression in remarkup of posts during moving, deleting, cyclic threads, etc due to permissions.
  - Small internal change to how dicerolls are processed.

### 0.5.1
  - Small change to expanding spoilered files.
  - Bugfix outdated bans template mixin.

### 0.5.0
  - Add tegaki.js (oekaki). Has board toggle and settings option for default canvas size.

### 0.4.1
  - Fix not properly skipping dnsbl with block bypass when configured to do so, give the better frame popup, and skip if already solved board captcha, etc.
  - Fix sessions list page showing expiry dates far in the past
  - Minor bugfix to flag saving.

### 0.4.0
  - Hashed IPs now use an irc-style "cloaking".
    - Ranges are now combined in the IP instead of being only available in the JSON and not shown in management pages.
    - IPs will end with .IP, bypasses will end in .BP and pruned ips will end in .PRUNED
  - Users can now list/delete their active login sessions.
  - New permission system. No more "levels" shit.
    - Boards no longer have "moderators" but "staff".
    - New "staff" page in board management, to add/remove/edit staff.
    - The global "accounts" and board "staff" pages allow editing individual permissions.
    - There is now more fine permission/access control system for global and board-level stuff.
    - Users with permission to edit accounts can edit accounts on a global level and grant them permissions.
    - Users with permission to edit board staff can do the same on a per-board level.
  - Better continuity between pages like "news", "accounts", "custompages", "staff" and the associated editieng page. The manage/globalmaange navbar stays in place with the appropriate section highlighted.
  - More linking between moderation interfaces e.g. globals board list will now show direct link to view the owners account.
  - Made some board and page titles more consistent.
  - Custom flag selection is now saved like name and post password.
  - Bugfixes.

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
  - [jschan-docs](https://fatchan.gitgud.site/jschan-docs/):
    - API docs improvements, now includes csrf token, posting, post actions (and mod variants), and more. It should be enough documentation for somebody to write a mobile app integration.
  - [globalafk](https://gitgud.io/fatchan/globalafk/) (my fork):
    - On android with termux, tapping the notification will open the post (in mod view) and the notification has new shortcut buttons to quickly delete, delete+ban or delete+global ban.

### 0.1.10
  - Add thread watcher/watchlist, so users can save list of threads to a little window and see unread count
  - There are now API docs available at https://fatchan.gitgud.site/jschan-docs/
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
