// ==UserScript==
// @name         HUNO UI Translator
// @namespace    https://github.com/SAGIRIxr/huno-ui-translator
// @version      0.4.0
// @description  Translate stable HUNO interface text to Simplified Chinese while leaving posts, announcements, torrent names, and other user content untouched.
// @author       SAGIRIxr
// @match        https://hawke.uno/*
// @match        https://*.hawke.uno/*
// @match        https://huno.tv/*
// @match        https://*.huno.tv/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/SAGIRIxr/huno-ui-translator/main/huno-ui-translator.user.js
// @updateURL    https://raw.githubusercontent.com/SAGIRIxr/huno-ui-translator/main/huno-ui-translator.user.js
// @supportURL   https://github.com/SAGIRIxr/huno-ui-translator/issues
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "huno-ui-translator-mode";
  const POSITION_KEY = "huno-ui-translator-position";
  const MODE = {
    ZH: "zh",
    ORIGINAL: "original",
    BILINGUAL: "bilingual",
  };

  const CONFIG = {
    debug: false,
    scanDelayMs: 120,
    defaultPosition: { top: 78, right: 16 },
  };

  const MODE_LABEL = {
    [MODE.ZH]: "\u7eaf\u4e2d\u6587",
    [MODE.ORIGINAL]: "\u7eaf\u539f\u6587",
    [MODE.BILINGUAL]: "\u4e2d\u6587/\u539f\u6587\u5bf9\u5e94",
  };

  let currentMode = getStoredMode();
  const originalText = new WeakMap();
  const renderedText = new WeakMap();
  const originalAttributes = new WeakMap();
  const renderedAttributes = new WeakMap();

  const SKIP_SELECTOR = [
    "script",
    "style",
    "textarea",
    "[contenteditable='true']",
    ".announcement",
    ".announcements",
    ".news",
    ".news_post",
    ".forum_post",
    ".forum-post",
    ".postbody",
    ".post_body",
    ".post_content",
    ".topic-post",
    ".topic_post",
    ".forum-topic",
    ".forum-topic__body",
    ".comment",
    ".comments",
    ".message",
    ".messages",
    ".private-message",
    ".notification",
    ".notifications-list",
    ".activity-feed",
    ".activity-list",
    ".chat",
    ".chat-message",
    ".ticket-message",
    ".torrent",
    ".torrentname",
    ".torrent_name",
    ".torrent-title",
    ".torrent_title",
    ".torrent-description",
    ".torrent__description",
    ".torrent-details",
    ".group_torrent",
    ".group",
    ".release",
    ".movie-title",
    ".title",
    ".description",
    ".bbcode",
    ".prose",
    ".markdown",
    ".wysiwyg",
    ".user-content",
    "[data-no-translate]",
    "[data-huno-content]",
    "article",
    "blockquote",
    "pre",
    "code",
    "table tbody",
  ].join(",");

  const ROOT_SELECTOR = [
    "header",
    "nav",
    "footer",
    "aside",
    ".header",
    ".topbar",
    ".navbar",
    ".nav",
    ".menu",
    ".sidebar",
    ".side_bar",
    ".subnav",
    ".tabs",
    ".tabbar",
    ".breadcrumbs",
    ".breadcrumb",
    ".pagination",
    ".pager",
    ".panel__heading",
    ".boxhead",
    ".head",
    ".thin > h2",
    ".thin > h3",
    "form",
    "thead",
    "tfoot",
    "button",
    ".button",
    ".btn",
    ".tooltip",
    ".modal",
    ".dialog",
    ".deep-space-topbar",
    ".deep-space-userbar",
    ".deep-space-user-card",
    ".deep-space-user-menu",
    ".deep-space-user-stats",
    ".deep-space-modal",
    ".deep-space-card",
    ".deep-space-panel",
    ".deep-space-tabs",
    ".deep-space-tab",
    ".deep-space-filter",
    ".deep-space-search",
    ".ds-field",
    ".ds-field__label",
    ".ds-field__input",
    ".ds-field__select",
    ".ds-btn-3d",
    ".ds-badge",
    ".ds-pill",
    ".ds-tabs",
    ".ds-tab",
    "label",
    "select",
    "option",
    "summary",
    "[role='dialog']",
    "[role='menu']",
    "[role='tablist']",
    "[role='tab']",
  ].join(",");

  const TEXT = new Map(Object.entries({
    "Home": "\u9996\u9875",
    "Menu": "\u83dc\u5355",
    "Torrents": "\u79cd\u5b50",
    "Requests": "\u6c42\u79cd",
    "Request": "\u6c42\u79cd",
    "Forums": "\u8bba\u575b",
    "Forum": "\u8bba\u575b",
    "Top 10": "Top 10",
    "Leaderboard": "\u6392\u884c\u699c",
    "Rules": "\u89c4\u5219",
    "Info": "\u4fe1\u606f",
    "FAQ": "\u5e38\u89c1\u95ee\u9898",
    "Wiki": "\u7ef4\u57fa",
    "Staff": "\u7ba1\u7406\u7ec4",
    "Staff PM": "\u7ba1\u7406\u7ec4\u79c1\u4fe1",
    "Inbox": "\u6536\u4ef6\u7bb1",
    "Notifications": "\u901a\u77e5",
    "Profile": "\u4e2a\u4eba\u8d44\u6599",
    "User CP": "\u7528\u6237\u9762\u677f",
    "Account": "\u8d26\u6237",
    "Dashboard": "\u4eea\u8868\u76d8",
    "Hub": "\u4e2d\u5fc3",
    "Store": "\u5546\u5e97",
    "History": "\u5386\u53f2",
    "Settings": "\u8bbe\u7f6e",
    "Logout": "\u9000\u51fa\u767b\u5f55",
    "Log out": "\u9000\u51fa\u767b\u5f55",
    "Login": "\u767b\u5f55",
    "Register": "\u6ce8\u518c",
    "Upload": "\u53d1\u5e03",
    "Upload Torrent": "\u53d1\u5e03\u79cd\u5b50",
    "Upload torrent": "\u53d1\u5e03\u79cd\u5b50",
    "Add Request": "\u65b0\u589e\u6c42\u79cd",
    "New Request": "\u65b0\u6c42\u79cd",
    "Donate": "\u6350\u8d60",
    "Bookmarks": "\u6536\u85cf",
    "Favorites": "\u6536\u85cf",
    "Collages": "\u5408\u96c6",
    "Artists": "\u521b\u4f5c\u8005",
    "Movies": "\u7535\u5f71",
    "TV": "\u5267\u96c6",
    "Anime": "\u52a8\u753b",
    "Search": "\u641c\u7d22",
    "Search torrents...": "\u641c\u7d22\u79cd\u5b50...",
    "Advanced Search": "\u9ad8\u7ea7\u641c\u7d22",
    "Advanced search": "\u9ad8\u7ea7\u641c\u7d22",
    "Browse": "\u6d4f\u89c8",
    "Options": "\u9009\u9879",
    "Tools": "\u5de5\u5177",
    "Actions": "\u64cd\u4f5c",
    "Help": "\u5e2e\u52a9",
    "Stats": "\u7edf\u8ba1",
    "Statistics": "\u7edf\u8ba1",
    "User": "\u7528\u6237",
    "Username": "\u7528\u6237\u540d",
    "Uploader": "\u53d1\u5e03\u8005",
    "Password": "\u5bc6\u7801",
    "Email": "\u90ae\u7bb1",
    "Remember me": "\u8bb0\u4f4f\u6211",
    "Submit": "\u63d0\u4ea4",
    "Save": "\u4fdd\u5b58",
    "Save changes": "\u4fdd\u5b58\u66f4\u6539",
    "Cancel": "\u53d6\u6d88",
    "Close": "\u5173\u95ed",
    "Confirm": "\u786e\u8ba4",
    "Continue": "\u7ee7\u7eed",
    "Back": "\u8fd4\u56de",
    "Reset": "\u91cd\u7f6e",
    "Delete": "\u5220\u9664",
    "Remove": "\u79fb\u9664",
    "Edit": "\u7f16\u8f91",
    "Preview": "\u9884\u89c8",
    "Send": "\u53d1\u9001",
    "Send Gift": "\u53d1\u9001\u793c\u7269",
    "Apply": "\u5e94\u7528",
    "Go": "\u524d\u5f80",
    "Yes": "\u662f",
    "No": "\u5426",
    "None": "\u65e0",
    "All": "\u5168\u90e8",
    "Any": "\u4efb\u610f",
    "New": "\u65b0",
    "Latest": "\u6700\u65b0",
    "Popular": "\u70ed\u95e8",
    "Hot": "\u70ed\u95e8",
    "Loved": "\u53d7\u559c\u7231",
    "Unread": "\u672a\u8bfb",
    "Read": "\u5df2\u8bfb",
    "Sticky": "\u7f6e\u9876",
    "Locked": "\u5df2\u9501\u5b9a",
    "Closed": "\u5df2\u5173\u95ed",
    "Open": "\u6253\u5f00",
    "Pinned": "\u7f6e\u9876",
    "Last post": "\u6700\u540e\u56de\u590d",
    "Last Post": "\u6700\u540e\u56de\u590d",
    "Topic": "\u4e3b\u9898",
    "Topics": "\u4e3b\u9898",
    "Posts": "\u5e16\u5b50",
    "Replies": "\u56de\u590d",
    "Views": "\u6d4f\u89c8",
    "View all": "\u67e5\u770b\u5168\u90e8",
    "View All": "\u67e5\u770b\u5168\u90e8",
    "Author": "\u4f5c\u8005",
    "Created": "\u521b\u5efa\u65f6\u95f4",
    "Updated": "\u66f4\u65b0\u65f6\u95f4",
    "Date": "\u65e5\u671f",
    "Time": "\u65f6\u95f4",
    "Name": "\u540d\u79f0",
    "Group": "\u5c0f\u7ec4",
    "Encoder": "\u538b\u5236\u7ec4",
    "Category": "\u5206\u7c7b",
    "Categories": "\u5206\u7c7b",
    "Type": "\u7c7b\u578b",
    "Types": "\u7c7b\u578b",
    "Size": "\u5927\u5c0f",
    "Files": "\u6587\u4ef6",
    "Snatched": "\u5b8c\u6210",
    "Completed": "\u5df2\u5b8c\u6210",
    "Bumped": "\u6700\u65b0\u6d3b\u8dc3",
    "Seeders": "\u505a\u79cd",
    "Leechers": "\u4e0b\u8f7d",
    "Peers": "\u540c\u4f34",
    "Uploaded": "\u5df2\u4e0a\u4f20",
    "Downloaded": "\u5df2\u4e0b\u8f7d",
    "Ratio": "\u5206\u4eab\u7387",
    "Bonus": "\u9b54\u529b",
    "Freeleech": "\u514d\u8d39",
    "Neutral Leech": "\u4e2d\u6027\u4e0b\u8f7d",
    "Double Upload": "\u53cc\u500d\u4e0a\u4f20",
    "Personal Freeleech": "\u4e2a\u4eba\u514d\u8d39",
    "Personal FL": "\u4e2a\u4eba\u514d\u8d39",
    "Free": "\u514d\u8d39",
    "Not Free": "\u975e\u514d\u8d39",
    "Tags": "\u6807\u7b7e",
    "Genres": "\u7c7b\u578b",
    "Filter": "\u7b5b\u9009",
    "Filters": "\u7b5b\u9009",
    "Show filters": "\u663e\u793a\u7b5b\u9009",
    "Hide filters": "\u9690\u85cf\u7b5b\u9009",
    "Clear": "\u6e05\u9664",
    "Clear filters": "\u6e05\u9664\u7b5b\u9009",
    "Clear Filters": "\u6e05\u9664\u7b5b\u9009",
    "Sort": "\u6392\u5e8f",
    "Sort ascending": "\u5347\u5e8f\u6392\u5e8f",
    "Sort descending": "\u964d\u5e8f\u6392\u5e8f",
    "Order": "\u987a\u5e8f",
    "Ascending": "\u5347\u5e8f",
    "Descending": "\u964d\u5e8f",
    "Next": "\u4e0b\u4e00\u9875",
    "Previous": "\u4e0a\u4e00\u9875",
    "Prev": "\u4e0a\u4e00\u9875",
    "First": "\u7b2c\u4e00\u9875",
    "Last": "\u6700\u540e\u4e00\u9875",
    "Page": "\u9875",
    "Per page": "\u6bcf\u9875\u6570\u91cf",
    "Per Page": "\u6bcf\u9875\u6570\u91cf",
    "Show": "\u663e\u793a",
    "Hide": "\u9690\u85cf",
    "Expand": "\u5c55\u5f00",
    "Collapse": "\u6536\u8d77",
    "Details": "\u8be6\u60c5",
    "Download": "\u4e0b\u8f7d",
    "Downloads": "\u4e0b\u8f7d",
    "Downloaded": "\u5df2\u4e0b\u8f7d",
    "Not Downloaded": "\u672a\u4e0b\u8f7d",
    "Seeding": "\u505a\u79cd\u4e2d",
    "Leeching": "\u4e0b\u8f7d\u4e2d",
    "Incomplete": "\u672a\u5b8c\u6210",
    "Report": "\u4e3e\u62a5",
    "Thanks": "\u611f\u8c22",
    "Thank": "\u611f\u8c22",
    "Quote": "\u5f15\u7528",
    "Reply": "\u56de\u590d",
    "Post reply": "\u53d1\u8868\u56de\u590d",
    "New topic": "\u65b0\u4e3b\u9898",
    "New Topic": "\u65b0\u4e3b\u9898",
    "Create topic": "\u521b\u5efa\u4e3b\u9898",
    "Create Topic": "\u521b\u5efa\u4e3b\u9898",
    "Create thread": "\u521b\u5efa\u4e3b\u9898",
    "Create Thread": "\u521b\u5efa\u4e3b\u9898",
    "Thread title": "\u4e3b\u9898\u6807\u9898",
    "Thread Title": "\u4e3b\u9898\u6807\u9898",
    "Mark all as read": "\u5168\u90e8\u6807\u4e3a\u5df2\u8bfb",
    "View unread posts": "\u67e5\u770b\u672a\u8bfb\u5e16\u5b50",
    "View new posts": "\u67e5\u770b\u65b0\u5e16\u5b50",
    "View active topics": "\u67e5\u770b\u6d3b\u8dc3\u4e3b\u9898",
    "Search this forum": "\u641c\u7d22\u672c\u7248",
    "Private messages": "\u79c1\u4fe1",
    "Private Messages": "\u79c1\u4fe1",
    "Compose": "\u5199\u4fe1",
    "Subject": "\u6807\u9898",
    "Recipient": "\u6536\u4ef6\u4eba",
    "Amount": "\u6570\u91cf",
    "Message": "\u6d88\u606f",
    "Invite": "\u9080\u8bf7",
    "Invites": "\u9080\u8bf7",
    "Shop": "\u5546\u5e97",
    "Gift": "\u793c\u7269",
    "Discuss": "\u8ba8\u8bba",
    "Chat": "\u804a\u5929",
    "Activity": "\u52a8\u6001",
    "Messages": "\u6d88\u606f",
    "Tickets": "\u5de5\u5355",
    "Ticket": "\u5de5\u5355",
    "Support": "\u652f\u6301",
    "HUNOmeter": "HUNOmeter",
    "Hunos": "Hunos",
    "Your balance": "\u4f60\u7684\u4f59\u989d",
    "You have no invites remaining.": "\u4f60\u6ca1\u6709\u5269\u4f59\u9080\u8bf7\u3002",
    "Pinboard": "\u516c\u544a\u677f",
    "Seeds": "\u79cd\u5b50",
    "Torrent Stats": "\u79cd\u5b50\u7edf\u8ba1",
    "Social Stats": "\u793e\u4ea4\u7edf\u8ba1",
    "Buffer": "\u7f13\u51b2\u91cf",
    "Seeding Size": "\u505a\u79cd\u4f53\u79ef",
    "Average Seedtime": "\u5e73\u5747\u505a\u79cd\u65f6\u95f4",
    "Uploaded / Downloaded": "\u4e0a\u4f20 / \u4e0b\u8f7d",
    "Active Seeds / Leeches": "\u6d3b\u8dc3\u505a\u79cd / \u4e0b\u8f7d",
    "Total Uploads / Downloads": "\u603b\u53d1\u5e03 / \u603b\u4e0b\u8f7d",
    "Last Month Uploads / Downloads": "\u4e0a\u6708\u53d1\u5e03 / \u4e0b\u8f7d",
    "Tips (Given / Received)": "\u6253\u8d4f\uff08\u9001\u51fa / \u6536\u5230\uff09",
    "Gifts (Given / Received)": "\u793c\u7269\uff08\u9001\u51fa / \u6536\u5230\uff09",
    "Bounty (Given / Received)": "\u60ac\u8d4f\uff08\u9001\u51fa / \u6536\u5230\uff09",
    "Likes (Given / Received)": "\u70b9\u8d5e\uff08\u9001\u51fa / \u6536\u5230\uff09",
    "Forum Threads Created": "\u521b\u5efa\u7684\u8bba\u575b\u4e3b\u9898",
    "Comments (Forum / Title)": "\u8bc4\u8bba\uff08\u8bba\u575b / \u6807\u9898\uff09",
    "Invites (Sent / Available)": "\u9080\u8bf7\uff08\u5df2\u53d1 / \u53ef\u7528\uff09",
    "Vanguard": "\u5148\u950b",
    "Squire": "\u4f8d\u4ece",
    "Knight": "\u9a91\u58eb",
    "Champion": "\u51a0\u519b",
    "Legend": "\u4f20\u5947",
    "Guardian": "\u5b88\u62a4\u8005",
    "Movie": "\u7535\u5f71",
    "Other": "\u5176\u4ed6",
    "Internal": "\u5185\u90e8",
    "Worthy": "\u5408\u683c",
    "Not Approved": "\u672a\u5ba1\u6838",
    "Season Pack": "\u5b63\u5305",
    "Stream": "\u6d41\u5a92\u4f53",
    "Alive": "\u6d3b\u8dc3",
    "Dying": "\u6fd2\u6b7b",
    "Dead": "\u65ad\u79cd",
    "Source Type": "\u6765\u6e90\u7c7b\u578b",
    "Streaming Service": "\u6d41\u5a92\u4f53\u670d\u52a1",
    "Language": "\u8bed\u8a00",
    "Source": "\u6765\u6e90",
    "Resolution": "\u5206\u8fa8\u7387",
    "Codec": "\u7f16\u7801",
    "Audio": "\u97f3\u9891",
    "HDR": "HDR",
    "Service": "\u670d\u52a1",
    "-- Select a forum --": "-- \u9009\u62e9\u8bba\u575b --",
    "Unset": "\u672a\u8bbe\u7f6e",
    "Unknown / N/A": "\u672a\u77e5 / \u4e0d\u9002\u7528",
    "You have unread activity": "\u6709\u672a\u8bfb\u52a8\u6001",
    "Class": "\u7b49\u7ea7",
    "Joined": "\u52a0\u5165\u65f6\u95f4",
    "Last seen": "\u6700\u540e\u5728\u7ebf",
    "Enabled": "\u5df2\u542f\u7528",
    "Disabled": "\u5df2\u7981\u7528",
    "Active": "\u6d3b\u8dc3",
    "Inactive": "\u4e0d\u6d3b\u8dc3",
    "Loading...": "\u52a0\u8f7d\u4e2d...",
    "Loading": "\u52a0\u8f7d\u4e2d",
    "Error": "\u9519\u8bef",
    "Success": "\u6210\u529f",
    "Warning": "\u8b66\u544a",
  }));

  const ATTRIBUTE_TEXT = new Map(Object.entries({
    "Search": "\u641c\u7d22",
    "Search torrents...": "\u641c\u7d22\u79cd\u5b50...",
    "Advanced Search": "\u9ad8\u7ea7\u641c\u7d22",
    "Username": "\u7528\u6237\u540d",
    "Uploader": "\u53d1\u5e03\u8005",
    "Recipient": "\u6536\u4ef6\u4eba",
    "Amount": "\u6570\u91cf",
    "Message": "\u6d88\u606f",
    "Password": "\u5bc6\u7801",
    "Email": "\u90ae\u7bb1",
    "Filter": "\u7b5b\u9009",
    "Go": "\u524d\u5f80",
    "Submit": "\u63d0\u4ea4",
    "Save": "\u4fdd\u5b58",
    "Cancel": "\u53d6\u6d88",
    "Enter thread title...": "\u8f93\u5165\u4e3b\u9898\u6807\u9898...",
    "Search this forum": "\u641c\u7d22\u672c\u7248",
    "Search requests...": "\u641c\u7d22\u6c42\u79cd...",
    "Search forums...": "\u641c\u7d22\u8bba\u575b...",
    "TMDB ID": "TMDB ID",
    "IMDB ID": "IMDB ID",
    "TVDB ID": "TVDB ID",
  }));

  const WORD_TEXT = [
    [/\bUploaded\b/g, "\u5df2\u4e0a\u4f20"],
    [/\bDownloaded\b/g, "\u5df2\u4e0b\u8f7d"],
    [/\bNotifications\b/g, "\u901a\u77e5"],
    [/\bMessages\b/g, "\u6d88\u606f"],
    [/\bTickets\b/g, "\u5de5\u5355"],
    [/\bRequests\b/g, "\u6c42\u79cd"],
    [/\bForums\b/g, "\u8bba\u575b"],
    [/\bSeeders\b/g, "\u505a\u79cd"],
    [/\bLeechers\b/g, "\u4e0b\u8f7d"],
    [/\bSeeds\b/g, "\u79cd\u5b50"],
    [/\bLeeches\b/g, "\u4e0b\u8f7d"],
    [/\bSnatched\b/g, "\u5b8c\u6210"],
    [/\bCompleted\b/g, "\u5df2\u5b8c\u6210"],
    [/\bActive\b/g, "\u6d3b\u8dc3"],
    [/\bSize\b/g, "\u5927\u5c0f"],
    [/\bCategory\b/g, "\u5206\u7c7b"],
    [/\bSearch\b/g, "\u641c\u7d22"],
    [/\beligible\b/g, "\u53ef\u7528"],
    [/\bYour balance:\b/g, "\u4f60\u7684\u4f59\u989d:"],
    [/\bGiven\b/g, "\u9001\u51fa"],
    [/\bReceived\b/g, "\u6536\u5230"],
    [/\bSent\b/g, "\u5df2\u53d1"],
    [/\bAvailable\b/g, "\u53ef\u7528"],
    [/\bForum\b/g, "\u8bba\u575b"],
    [/\bThread\b/g, "\u4e3b\u9898"],
    [/\bThreads\b/g, "\u4e3b\u9898"],
    [/\bTitle\b/g, "\u6807\u9898"],
    [/\bUploads\b/g, "\u53d1\u5e03"],
    [/\bDownloads\b/g, "\u4e0b\u8f7d"],
    [/\bSeedtime\b/g, "\u505a\u79cd\u65f6\u95f4"],
    [/\bVanguard\b/g, "\u5148\u950b"],
    [/\bSquire\b/g, "\u4f8d\u4ece"],
    [/\bKnight\b/g, "\u9a91\u58eb"],
    [/\bChampion\b/g, "\u51a0\u519b"],
    [/\bLegend\b/g, "\u4f20\u5947"],
    [/\bGuardian\b/g, "\u5b88\u62a4\u8005"],
  ];

  function getStoredMode() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return Object.values(MODE).includes(stored) ? stored : MODE.ZH;
  }

  function setStoredMode(mode) {
    currentMode = mode;
    window.localStorage.setItem(STORAGE_KEY, mode);
    renderModeSwitcher();
    translate();
  }

  function getStoredPosition() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(POSITION_KEY) || "null");
      if (parsed && Number.isFinite(parsed.left) && Number.isFinite(parsed.top)) {
        return parsed;
      }
    } catch (error) {
      log("invalid stored position", error);
    }
    return null;
  }

  function setStoredPosition(position) {
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  }

  function applySwitcherPosition(container) {
    const saved = getStoredPosition();
    if (saved) {
      const clamped = clampPosition(saved.left, saved.top, container);
      container.style.left = `${clamped.left}px`;
      container.style.top = `${clamped.top}px`;
      container.style.right = "auto";
      container.style.bottom = "auto";
      return;
    }

    container.style.left = "auto";
    container.style.top = `${CONFIG.defaultPosition.top}px`;
    container.style.right = `${CONFIG.defaultPosition.right}px`;
    container.style.bottom = "auto";
  }

  function clampPosition(left, top, element) {
    const margin = 8;
    const width = element.offsetWidth || 220;
    const height = element.offsetHeight || 72;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    return {
      left: Math.min(Math.max(margin, left), maxLeft),
      top: Math.min(Math.max(margin, top), maxTop),
    };
  }

  function enableSwitcherDrag(container) {
    const handle = container.querySelector(".huno-ui-translator__handle");
    if (!handle || handle.dataset.dragReady === "true") return;
    handle.dataset.dragReady = "true";

    let dragging = null;
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const rect = container.getBoundingClientRect();
      dragging = {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
      container.classList.add("is-dragging");
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    handle.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const next = clampPosition(event.clientX - dragging.offsetX, event.clientY - dragging.offsetY, container);
      container.style.left = `${next.left}px`;
      container.style.top = `${next.top}px`;
      container.style.right = "auto";
      container.style.bottom = "auto";
    });

    const finish = (event) => {
      if (!dragging) return;
      const rect = container.getBoundingClientRect();
      const next = clampPosition(rect.left, rect.top, container);
      setStoredPosition(next);
      container.classList.remove("is-dragging");
      dragging = null;
      try {
        handle.releasePointerCapture(event.pointerId);
      } catch (error) {
        log("pointer release skipped", error);
      }
    };

    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
    window.addEventListener("resize", () => applySwitcherPosition(container));
  }

  function shouldSkip(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !element || Boolean(element.closest(SKIP_SELECTOR));
  }

  function isInsideAllowedRoot(element) {
    return Boolean(element.closest(ROOT_SELECTOR));
  }

  function preserveOuterWhitespace(original, translated) {
    const leading = original.match(/^\s*/)[0];
    const trailing = original.match(/\s*$/)[0];
    return `${leading}${translated}${trailing}`;
  }

  function formatTranslation(original, translated) {
    if (!translated || translated === original) return original;
    if (currentMode === MODE.ORIGINAL) return original;
    if (currentMode === MODE.BILINGUAL) return `${translated}\uff08${original}\uff09`;
    return translated;
  }

  function translateTextValue(value) {
    const trimmed = value.trim();
    if (!trimmed) return value;

    const exact = TEXT.get(trimmed);
    if (exact) {
      return preserveOuterWhitespace(value, formatTranslation(trimmed, exact));
    }

    let changed = trimmed;
    for (const [pattern, replacement] of WORD_TEXT) {
      changed = changed.replace(pattern, replacement);
    }
    return changed === trimmed ? value : preserveOuterWhitespace(value, formatTranslation(trimmed, changed));
  }

  function getOriginalAttribute(element, attribute) {
    let values = originalAttributes.get(element);
    if (!values) {
      values = new Map();
      originalAttributes.set(element, values);
    }
    let rendered = renderedAttributes.get(element);
    if (!rendered) {
      rendered = new Map();
      renderedAttributes.set(element, rendered);
    }
    const current = element.getAttribute(attribute) || "";
    if (values.has(attribute) && rendered.has(attribute) && current !== rendered.get(attribute)) {
      values.set(attribute, current);
    }
    if (!values.has(attribute)) {
      values.set(attribute, current);
    }
    return values.get(attribute);
  }

  function translateAttribute(element, attribute, dictionary) {
    if (!element.hasAttribute(attribute)) return;
    const original = getOriginalAttribute(element, attribute);
    const translated = dictionary.get(original.trim());
    const next = translated
      ? preserveOuterWhitespace(original, formatTranslation(original.trim(), translated))
      : original;
    if (element.getAttribute(attribute) !== next) {
      element.setAttribute(attribute, next);
    }
    renderedAttributes.get(element).set(attribute, next);
  }

  function translateElementAttributes(root) {
    const elements = root.querySelectorAll("input, button, textarea, select, option, a, [title], [aria-label]");
    for (const element of elements) {
      if (shouldSkip(element) || !isInsideAllowedRoot(element)) continue;
      translateAttribute(element, "placeholder", ATTRIBUTE_TEXT);
      translateAttribute(element, "title", TEXT);
      translateAttribute(element, "aria-label", TEXT);
      if (["button", "submit", "reset"].includes((element.getAttribute("type") || "").toLowerCase())) {
        translateAttribute(element, "value", TEXT);
      }
    }
  }

  function translateTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || shouldSkip(node) || !isInsideAllowedRoot(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      const current = node.nodeValue || "";
      if (originalText.has(node) && renderedText.has(node) && current !== renderedText.get(node)) {
        originalText.set(node, current);
      } else if (!originalText.has(node)) {
        originalText.set(node, current);
      }
      const original = originalText.get(node);
      const translated = translateTextValue(original);
      if (translated !== node.nodeValue) {
        node.nodeValue = translated;
      }
      renderedText.set(node, translated);
    }
  }

  function translate(root = document.body) {
    if (!root) return;
    translateTextNodes(root);
    translateElementAttributes(root);
  }

  function renderModeSwitcher() {
    let container = document.getElementById("huno-ui-translator-switcher");
    if (!container) {
      container = document.createElement("div");
      container.id = "huno-ui-translator-switcher";
      container.setAttribute("data-no-translate", "true");
      container.innerHTML = [
        "<div class=\"huno-ui-translator__handle\" title=\"\u62d6\u52a8\u79fb\u52a8\">",
        "  <span class=\"huno-ui-translator__dot\"></span>",
        "  <span class=\"huno-ui-translator__title\">HUNO \u7ffb\u8bd1</span>",
        "</div>",
        "<label class=\"huno-ui-translator__field\" for=\"huno-ui-translator-mode\">",
        "  <span>\u663e\u793a\u6a21\u5f0f</span>",
        "  <select id=\"huno-ui-translator-mode\"></select>",
        "</label>",
      ].join("");
      document.body.appendChild(container);

      const style = document.createElement("style");
      style.setAttribute("data-no-translate", "true");
      style.textContent = `
        #huno-ui-translator-switcher {
          position: fixed;
          top: 78px;
          right: 16px;
          z-index: 2147483647;
          width: 218px;
          border: 1px solid rgba(88, 166, 255, 0.34);
          border-radius: 8px;
          background:
            linear-gradient(180deg, rgba(20, 28, 43, 0.96), rgba(9, 13, 22, 0.94));
          color: #e6edf7;
          font: 12px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(10px);
          overflow: hidden;
          user-select: none;
        }
        #huno-ui-translator-switcher.is-dragging {
          opacity: 0.92;
          cursor: grabbing;
        }
        #huno-ui-translator-switcher .huno-ui-translator__handle {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 30px;
          padding: 7px 10px;
          border-bottom: 1px solid rgba(88, 166, 255, 0.2);
          background: linear-gradient(180deg, rgba(45, 72, 112, 0.72), rgba(23, 35, 55, 0.68));
          cursor: grab;
        }
        #huno-ui-translator-switcher .huno-ui-translator__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #58a6ff;
          box-shadow: 0 0 12px rgba(88, 166, 255, 0.9);
          flex: 0 0 auto;
        }
        #huno-ui-translator-switcher .huno-ui-translator__title {
          font-weight: 700;
          letter-spacing: 0;
          color: #f4f8ff;
        }
        #huno-ui-translator-switcher .huno-ui-translator__field {
          display: grid;
          gap: 6px;
          padding: 9px 10px 10px;
          color: #9fb3cc;
        }
        #huno-ui-translator-switcher select {
          width: 100%;
          min-height: 30px;
          border: 1px solid rgba(88, 166, 255, 0.35);
          border-radius: 6px;
          background: rgba(7, 12, 20, 0.92);
          color: #f4f8ff;
          font: inherit;
          outline: none;
        }
        #huno-ui-translator-switcher select:focus {
          border-color: rgba(88, 166, 255, 0.8);
          box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.18);
        }
      `;
      document.head.appendChild(style);

      const select = container.querySelector("select");
      for (const mode of Object.values(MODE)) {
        const option = document.createElement("option");
        option.value = mode;
        option.textContent = MODE_LABEL[mode];
        select.appendChild(option);
      }
      select.addEventListener("change", () => setStoredMode(select.value));
      enableSwitcherDrag(container);
    }

    const select = container.querySelector("select");
    if (select.value !== currentMode) {
      select.value = currentMode;
    }
    applySwitcherPosition(container);
  }

  function log(...args) {
    if (CONFIG.debug) console.debug("[HUNO UI Translator]", ...args);
  }

  let timer = 0;
  function scheduleTranslate() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      log("scan");
      renderModeSwitcher();
      translate();
    }, CONFIG.scanDelayMs);
  }

  renderModeSwitcher();
  translate();

  new MutationObserver(scheduleTranslate).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();
