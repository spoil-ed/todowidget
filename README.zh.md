# TodoWidget

一个极简的 Windows 桌面 TODO 应用，支持日 / 周 / 月三种日历视图。

---

## 功能

- 日历视图切换：日、周、月
- 月视图每格显示 todo 预览，超出显示 +N
- 左侧迷你月历，独立游标，点击快速跳转日期
- 顶栏 `+` 按钮可向任意日期添加 todo
- 勾选完成、悬停删除
- 数据本地持久化为 JSON 文件，无需网络
- 日期计算对齐北京时间（UTC+8）

---

## 技术栈

- Vue 3 + Vuex 4
- Electron 25
- electron-store（本地 JSON 持久化）
- moment.js（zh-cn 中文日期）
- Bootstrap Icons

---

## 开发

```bash
npm install
npm run electron:serve   # 启动开发模式
npm test                 # 运行单元测试
```

> 如遇 `ENOSPC` inotify 错误：
> `sudo sysctl fs.inotify.max_user_watches=524288`

---

## 构建

在 **Windows** 上执行：

```bash
npm run electron:build -- --win --x64
```

输出：`dist_electron/TodoWidget Setup 1.0.0.exe`（NSIS 安装包）

> Linux 跨平台构建需要安装 Wine。

---

## 数据位置

```
%APPDATA%\todowidget\todos.json
%APPDATA%\todowidget\config.json
```
