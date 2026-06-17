// ==UserScript==
// @name         HUNO UI Translator
// @namespace    https://github.com/SAGIRIxr/huno-ui-translator
// @version      0.2.0
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
  const MODE = {
    ZH: "zh",
    ORIGINAL: "original",
    BILINGUAL: "bilingual",
  };

  const CONFIG = {
    debug: false,
    scanDelayMs: 120,
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
    "Home": "\u9996\u9875",
    "Torrents": "\u79cd\u5b50",
    "Requests": "\u6c42\u79cd",
    "Forums": "\u8bba\u575b",
    "Forum": "\u8bba\u575b",
    "Top 10": "Top 10",
    "Rules": "\u89c4\u5219",
    "Wiki": "\u7ef4\u57fa",
    "Staff": "\u7ba1\u7406\u7ec4",
    "Staff PM": "\u7ba1\u7406\u7ec4\u79c1\u4fe1",
    "Inbox": "\u6536\u4ef6\u7bb1",
    "Notifications": "\u901a\u77e5",
    "Profile": "\u4e2a\u4eba\u8d44\u6599",
    "User CP": "\u7528\u6237\u9762\u677f",
    "Settings": "\u8bbe\u7f6e",
    "Logout": "\u9000\u51fa\u767b\u5f55",
    "Log out": "\u9000\u51fa\u767b\u5f55",
    "Login": "\u767b\u5f55",
    "Register": "\u6ce8\u518c",
    "Upload": "\u53d1\u5e03",
    "Upload torrent": "\u53d1\u5e03\u79cd\u5b50",
    "Donate": "\u6350\u8d60",
    "Bookmarks": "\u6536\u85cf",
    "Collages": "\u5408\u96c6",
    "Artists": "\u521b\u4f5c\u8005",
    "Movies": "\u7535\u5f71",
    "TV": "\u5267\u96c6",
    "Anime": "\u52a8\u753b",
    "Search": "\u641c\u7d22",
    "Advanced Search": "\u9ad8\u7ea7\u641c\u7d22",
    "Advanced search": "\u9ad8\u7ea7\u641c\u7d22",
    "Browse": "\u6d4f\u89c8",
    "Options": "\u9009\u9879",
    "Tools": "\u5de5\u5177",
    "Help": "\u5e2e\u52a9",
    "Stats": "\u7edf\u8ba1",
    "Statistics": "\u7edf\u8ba1",
    "User": "\u7528\u6237",
    "Username": "\u7528\u6237\u540d",
    "Password": "\u5bc6\u7801",
    "Email": "\u90ae\u7bb1",
    "Remember me": "\u8bb0\u4f4f\u6211",
    "Submit": "\u63d0\u4ea4",
    "Save": "\u4fdd\u5b58",
    "Save changes": "\u4fdd\u5b58\u66f4\u6539",
    "Cancel": "\u53d6\u6d88",
    "Reset": "\u91cd\u7f6e",
    "Delete": "\u5220\u9664",
    "Edit": "\u7f16\u8f91",
    "Preview": "\u9884\u89c8",
    "Send": "\u53d1\u9001",
    "Apply": "\u5e94\u7528",
    "Go": "\u524d\u5f80",
    "Yes": "\u662f",
    "No": "\u5426",
    "None": "\u65e0",
    "All": "\u5168\u90e8",
    "Any": "\u4efb\u610f",
    "New": "\u65b0",
    "Unread": "\u672a\u8bfb",
    "Read": "\u5df2\u8bfb",
    "Sticky": "\u7f6e\u9876",
    "Locked": "\u5df2\u9501\u5b9a",
    "Closed": "\u5df2\u5173\u95ed",
    "Open": "\u6253\u5f00",
    "Last post": "\u6700\u540e\u56de\u590d",
    "Last Post": "\u6700\u540e\u56de\u590d",
    "Topic": "\u4e3b\u9898",
    "Topics": "\u4e3b\u9898",
    "Posts": "\u5e16\u5b50",
    "Replies": "\u56de\u590d",
    "Views": "\u6d4f\u89c8",
    "Author": "\u4f5c\u8005",
    "Created": "\u521b\u5efa\u65f6\u95f4",
    "Updated": "\u66f4\u65b0\u65f6\u95f4",
    "Date": "\u65e5\u671f",
    "Time": "\u65f6\u95f4",
    "Name": "\u540d\u79f0",
    "Category": "\u5206\u7c7b",
    "Type": "\u7c7b\u578b",
    "Size": "\u5927\u5c0f",
    "Files": "\u6587\u4ef6",
    "Snatched": "\u5b8c\u6210",
    "Seeders": "\u505a\u79cd",
    "Leechers": "\u4e0b\u8f7d",
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
    "Tags": "\u6807\u7b7e",
    "Filter": "\u7b5b\u9009",
    "Filters": "\u7b5b\u9009",
    "Clear": "\u6e05\u9664",
    "Clear filters": "\u6e05\u9664\u7b5b\u9009",
    "Sort": "\u6392\u5e8f",
    "Order": "\u987a\u5e8f",
    "Ascending": "\u5347\u5e8f",
    "Descending": "\u964d\u5e8f",
    "Next": "\u4e0b\u4e00\u9875",
    "Previous": "\u4e0a\u4e00\u9875",
    "Prev": "\u4e0a\u4e00\u9875",
    "First": "\u7b2c\u4e00\u9875",
    "Last": "\u6700\u540e\u4e00\u9875",
    "Page": "\u9875",
    "Show": "\u663e\u793a",
    "Hide": "\u9690\u85cf",
    "Expand": "\u5c55\u5f00",
    "Collapse": "\u6536\u8d77",
    "Details": "\u8be6\u60c5",
    "Download": "\u4e0b\u8f7d",
    "Report": "\u4e3e\u62a5",
    "Thanks": "\u611f\u8c22",
    "Thank": "\u611f\u8c22",
    "Quote": "\u5f15\u7528",
    "Reply": "\u56de\u590d",
    "Post reply": "\u53d1\u8868\u56de\u590d",
    "New topic": "\u65b0\u4e3b\u9898",
    "New Topic": "\u65b0\u4e3b\u9898",
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
    "Invite": "\u9080\u8bf7",
    "Invites": "\u9080\u8bf7",
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
    "Advanced Search": "\u9ad8\u7ea7\u641c\u7d22",
    "Username": "\u7528\u6237\u540d",
    "Password": "\u5bc6\u7801",
    "Email": "\u90ae\u7bb1",
    "Filter": "\u7b5b\u9009",
    "Go": "\u524d\u5f80",
    "Submit": "\u63d0\u4ea4",
    "Save": "\u4fdd\u5b58",
    "Cancel": "\u53d6\u6d88",
  }));

  const WORD_TEXT = [
    [/\bUploaded\b/g, "\u5df2\u4e0a\u4f20"],
    [/\bDownloaded\b/g, "\u5df2\u4e0b\u8f7d"],
    [/\bSeeders\b/g, "\u505a\u79cd"],
    [/\bLeechers\b/g, "\u4e0b\u8f7d"],
    [/\bSnatched\b/g, "\u5b8c\u6210"],
    [/\bSize\b/g, "\u5927\u5c0f"],
    [/\bCategory\b/g, "\u5206\u7c7b"],
    [/\bSearch\b/g, "\u641c\u7d22"],
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
        "<label for=\"huno-ui-translator-mode\">\u7ffb\u8bd1</label>",
        "<select id=\"huno-ui-translator-mode\"></select>",
      ].join("");
      document.body.appendChild(container);

      const style = document.createElement("style");
      style.setAttribute("data-no-translate", "true");
      style.textContent = `
        #huno-ui-translator-switcher {
          position: fixed;
          right: 12px;
          bottom: 12px;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 8px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 6px;
          background: rgba(20, 24, 28, 0.9);
          color: #fff;
          font: 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
        }
        #huno-ui-translator-switcher select {
          max-width: 128px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          background: #fff;
          color: #111;
          font: inherit;
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
    }

    const select = container.querySelector("select");
    if (select.value !== currentMode) {
      select.value = currentMode;
    }
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
