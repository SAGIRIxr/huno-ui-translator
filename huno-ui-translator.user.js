// ==UserScript==
// @name         HUNO UI Translator
// @namespace    https://github.com/SAGIRIxr/huno-ui-translator
// @version      0.1.0
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

  const CONFIG = {
    debug: false,
    scanDelayMs: 120,
  };

  const SKIP_SELECTOR = [
    "script",
    "style",
    "textarea",
    "input:not([type='button']):not([type='submit']):not([type='reset'])",
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
    ".comment",
    ".comments",
    ".torrent",
    ".torrentname",
    ".torrent_name",
    ".torrent-title",
    ".torrent_title",
    ".group_torrent",
    ".group",
    ".release",
    ".movie-title",
    ".title",
    ".description",
    ".bbcode",
    ".user-content",
    ".content",
    "[data-no-translate]",
    "article",
    "blockquote",
    "pre",
    "code",
    "main table tbody",
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
  ].join(",");

  const TEXT = new Map(Object.entries({
    "Home": "首页",
    "Torrents": "种子",
    "Requests": "求种",
    "Forums": "论坛",
    "Forum": "论坛",
    "Top 10": "Top 10",
    "Rules": "规则",
    "Wiki": "维基",
    "Staff": "管理组",
    "Staff PM": "管理组私信",
    "Inbox": "收件箱",
    "Notifications": "通知",
    "Profile": "个人资料",
    "User CP": "用户面板",
    "Settings": "设置",
    "Logout": "退出登录",
    "Log out": "退出登录",
    "Login": "登录",
    "Register": "注册",
    "Upload": "发布",
    "Upload torrent": "发布种子",
    "Donate": "捐赠",
    "Bookmarks": "收藏",
    "Collages": "合集",
    "Artists": "创作者",
    "Movies": "电影",
    "TV": "剧集",
    "Anime": "动画",
    "Search": "搜索",
    "Advanced Search": "高级搜索",
    "Advanced search": "高级搜索",
    "Browse": "浏览",
    "Options": "选项",
    "Tools": "工具",
    "Help": "帮助",
    "Stats": "统计",
    "Statistics": "统计",
    "User": "用户",
    "Username": "用户名",
    "Password": "密码",
    "Email": "邮箱",
    "Remember me": "记住我",
    "Submit": "提交",
    "Save": "保存",
    "Save changes": "保存更改",
    "Cancel": "取消",
    "Reset": "重置",
    "Delete": "删除",
    "Edit": "编辑",
    "Preview": "预览",
    "Send": "发送",
    "Apply": "应用",
    "Go": "前往",
    "Yes": "是",
    "No": "否",
    "None": "无",
    "All": "全部",
    "Any": "任意",
    "New": "新",
    "Unread": "未读",
    "Read": "已读",
    "Sticky": "置顶",
    "Locked": "已锁定",
    "Closed": "已关闭",
    "Open": "打开",
    "Last post": "最后回复",
    "Last Post": "最后回复",
    "Topic": "主题",
    "Topics": "主题",
    "Posts": "帖子",
    "Replies": "回复",
    "Views": "浏览",
    "Author": "作者",
    "Created": "创建时间",
    "Updated": "更新时间",
    "Date": "日期",
    "Time": "时间",
    "Name": "名称",
    "Category": "分类",
    "Type": "类型",
    "Size": "大小",
    "Files": "文件",
    "Snatched": "完成",
    "Seeders": "做种",
    "Leechers": "下载",
    "Uploaded": "已上传",
    "Downloaded": "已下载",
    "Ratio": "分享率",
    "Bonus": "魔力",
    "Freeleech": "免费",
    "Neutral Leech": "中性下载",
    "Double Upload": "双倍上传",
    "Personal Freeleech": "个人免费",
    "Personal FL": "个人免费",
    "Free": "免费",
    "Tags": "标签",
    "Filter": "筛选",
    "Filters": "筛选",
    "Clear": "清除",
    "Clear filters": "清除筛选",
    "Sort": "排序",
    "Order": "顺序",
    "Ascending": "升序",
    "Descending": "降序",
    "Next": "下一页",
    "Previous": "上一页",
    "Prev": "上一页",
    "First": "第一页",
    "Last": "最后一页",
    "Page": "页",
    "Show": "显示",
    "Hide": "隐藏",
    "Expand": "展开",
    "Collapse": "收起",
    "Details": "详情",
    "Download": "下载",
    "Report": "举报",
    "Thanks": "感谢",
    "Thank": "感谢",
    "Quote": "引用",
    "Reply": "回复",
    "Post reply": "发表回复",
    "New topic": "新主题",
    "New Topic": "新主题",
    "Mark all as read": "全部标为已读",
    "View unread posts": "查看未读帖子",
    "View new posts": "查看新帖子",
    "View active topics": "查看活跃主题",
    "Search this forum": "搜索本版",
    "Private messages": "私信",
    "Private Messages": "私信",
    "Compose": "写信",
    "Subject": "标题",
    "Recipient": "收件人",
    "Invite": "邀请",
    "Invites": "邀请",
    "Class": "等级",
    "Joined": "加入时间",
    "Last seen": "最后在线",
    "Enabled": "已启用",
    "Disabled": "已禁用",
    "Active": "活跃",
    "Inactive": "不活跃",
    "Loading...": "加载中...",
    "Loading": "加载中",
    "Error": "错误",
    "Success": "成功",
    "Warning": "警告",
  }));

  const ATTRIBUTE_TEXT = new Map(Object.entries({
    "Search": "搜索",
    "Advanced Search": "高级搜索",
    "Username": "用户名",
    "Password": "密码",
    "Email": "邮箱",
    "Filter": "筛选",
    "Go": "前往",
    "Submit": "提交",
    "Save": "保存",
    "Cancel": "取消",
  }));

  const WORD_TEXT = [
    [/\bUploaded\b/g, "已上传"],
    [/\bDownloaded\b/g, "已下载"],
    [/\bSeeders\b/g, "做种"],
    [/\bLeechers\b/g, "下载"],
    [/\bSnatched\b/g, "完成"],
    [/\bSize\b/g, "大小"],
    [/\bCategory\b/g, "分类"],
    [/\bSearch\b/g, "搜索"],
  ];

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

  function translateTextValue(value) {
    const trimmed = value.trim();
    if (!trimmed) return value;
    const exact = TEXT.get(trimmed);
    if (exact) return preserveOuterWhitespace(value, exact);

    let changed = trimmed;
    for (const [pattern, replacement] of WORD_TEXT) {
      changed = changed.replace(pattern, replacement);
    }
    return changed === trimmed ? value : preserveOuterWhitespace(value, changed);
  }

  function translateAttribute(element, attribute, dictionary) {
    if (!element.hasAttribute(attribute)) return;
    const current = element.getAttribute(attribute);
    const translated = dictionary.get((current || "").trim());
    if (translated && current !== translated) {
      element.setAttribute(attribute, preserveOuterWhitespace(current, translated));
    }
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
      const translated = translateTextValue(node.nodeValue || "");
      if (translated !== node.nodeValue) {
        node.nodeValue = translated;
      }
    }
  }

  function translate(root = document.body) {
    if (!root) return;
    translateTextNodes(root);
    translateElementAttributes(root);
  }

  function log(...args) {
    if (CONFIG.debug) console.debug("[HUNO UI Translator]", ...args);
  }

  let timer = 0;
  function scheduleTranslate() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      log("scan");
      translate();
    }, CONFIG.scanDelayMs);
  }

  translate();

  new MutationObserver(scheduleTranslate).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
