# VS Code 插件模板

这是一个Visual Studio Code插件开发模板，包含基础扩展功能配置。

## 功能特性

✅ 智能路径解析  
✅ 多环境路径兼容(绝对/相对路径)  
✅ 行号精确定位  
✅ 错误处理机制  
✅ 多语言本地化支持

## 命令说明

🔧 `extension.navigateToOrigin`  
定位到当前文件中首次出现目标文件路径的行

🔧 `extension.openTargetFile`  
根据最近的行号指令打开对应源文件并跳转到指定行

## 路径处理

- 自动识别工作区根目录
- 支持绝对路径和相对路径混合使用
- 智能处理Windows/Linux路径分隔符
- 文件不存在时显示本地化错误提示

## 安装要求

- Visual Studio Code 1.85+ 
- Node.js 18.x

## 配置说明

在package.json中添加以下配置：

```json
"contributes": {
  "commands": [
    {
      "command": "extension.navigateToOrigin",
      "title": "定位到原始引入位置"
    },
    {
      "command": "extension.openTargetFile",
      "title": "打开关联源文件"
    }
  ]
}
```

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 调试运行：
按下`F5`启动调试扩展

3. 打包发布：
```bash
npm run package
```

## 项目结构

```
├── extension.js       # 扩展主入口
├── package.json       # 扩展清单
├── package.nls.json   # 本地化资源
└── icon.jpeg          # 扩展图标
```

## 贡献指南

欢迎提交PR或issue，请遵循现有代码规范。

## 许可协议

[MIT License](LICENSE.md)