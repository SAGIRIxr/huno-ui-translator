# HUNO UI Translator

HUNO 固定界面简体中文翻译油猴脚本。

脚本只翻译导航、表头、表单、按钮、分页、侧栏、弹窗等稳定 UI 文案，默认跳过帖子正文、公告、种子标题、评论、描述和表格正文等用户内容。

页面右上角会显示可拖动的悬浮模式切换器：

- 纯中文：只显示中文翻译。
- 纯原文：恢复并保留英文原文。
- 中文/原文对应：显示为 `中文（English）`。

模式偏好和悬浮窗位置都会保存在浏览器本地，下次打开 HUNO 会自动沿用。

## 安装

1. 安装 Tampermonkey、Violentmonkey 或同类用户脚本管理器。
2. 导入 `huno-ui-translator.user.js`。
3. 打开 HUNO，刷新页面。

## 设计原则

- 使用固定文案字典，不做整页机器翻译。
- 只扫描白名单 UI 容器，包括 HUNO Deep Space 顶栏、筛选器、表单、弹窗、标签页、用户菜单和统计面板。
- 对帖子、公告、种子、评论、正文类区域设置跳过规则。
- 动态页面变化会通过 `MutationObserver` 延迟重扫。

## 发布

GitHub 仓库创建后，可以把 GreasyFork 的脚本同步地址指向 GitHub Raw 文件。

推荐 GreasyFork 元数据：

- 名称：HUNO UI Translator
- 描述：Translate stable HUNO interface text to Simplified Chinese while leaving posts, announcements, torrent names, and other user content untouched.
- 许可证：MIT
- 同步 URL：`https://raw.githubusercontent.com/SAGIRIxr/huno-ui-translator/main/huno-ui-translator.user.js`

## 调整翻译

新增固定 UI 翻译时，优先补充 `TEXT` 或 `ATTRIBUTE_TEXT` 字典。不要扩大扫描范围到内容主体，除非能确定目标是固定界面元素。
