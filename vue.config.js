module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: "com.todowidget.app",
        productName: "TodoWidget",
        win: {
          target: ["nsis"],
          icon: "build/icon.ico",
        },
      },
    },
  },
}
