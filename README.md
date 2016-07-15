# Clantujs

## 简介

## 安装
`npm install --save clantujs`

## 示例
```sh
npm install
npm run serve-example
```

## Api
### 基础
#### clantu.start([options])
启动应用

#### clantu.stop()
停止应用

#### clantu.show(path)
匹配新的路由，浏览器URL不改变

#### clantu.go(path)
导航到一个新的路由，浏览器URL改变，增加一条历史记录

#### clantu.replace(path[, force])
导航到一个新的路由，浏览器URL改变，不增加历史记录


### 路由
#### clantu.router(path, callback[, callback ...])
#### clantu.router.exit(path, callback[, callback ...])


#### Route

`ctx.$state`
`ctx.$path`
`ctx.$params`
`ctx.$pathname`
`ctx.$hash`
`ctx.$querystring`
`ctx.$query`
`ctx.$render(source, data)`


### 模版
### clantu.render(source, data, options|filename)
返回渲染结果

### clantu.template(source, options|filename)
返回一个渲染函数

### clantu.template.helper(name, callback)
添加辅助方法

### clantu.template.partial(name, callback)
添加模板片段

### clantu.template.render(source, data, options|filename)
返回渲染结果


## 测试


## 关于项目
> 部分代码来源于page.js、vue-router、path-to-regexp、artTemplate、handlebars等优秀的开源项目。

本项目是对相关项目功能进行了一定的精简，以达到减少体积、适应项目特性的目的。
感谢相关开源项目作者的无私奉献，若有冒犯，望请见谅。
如需删除与您权益相关的代码，请与我联系。
