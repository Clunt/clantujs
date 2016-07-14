# Clantujs

## 简介

## 安装
`npm install --save clantujs`

## 示例
## Api
### 基础
#### c.start([options])
启动应用

#### c.stop()
停止应用

#### c.show(path)
匹配新的路由，浏览器URL不改变

#### c.go(path)
导航到一个新的路由，浏览器URL改变，增加一条历史记录

#### c.replace(path[, force])
导航到一个新的路由，浏览器URL改变，不增加历史记录


### 路由
#### c.router(path, callback[, callback ...])
#### c.router.exit(path, callback[, callback ...])


#### Route

`ctx.$state`
`ctx.$path`
`ctx.$params`
`ctx.$pathname`
`ctx.$hash`
`ctx.$querystring`
`ctx.$query`
`ctx.$render(template_source, data)`


### 模版
### c.render(template_source, data)
返回渲染结果

### c.template(source, options)
返回一个渲染函数

### c.template.config(options)
更改模版引擎的默认配置

### c.template.helper(name, callback)
添加辅助方法

### c.template.partial(name, callback)
添加模板片段

### c.template.render(template_source, data)
返回渲染结果


## 测试


## 关于项目
> 部分代码来源于page.js、vue-router、path-to-regexp、artTemplate、handlebars等优秀的开源项目。

本项目是对相关项目功能进行了一定的精简，以达到减少体积、适应项目特性的目的。
感谢相关开源项目作者的无私奉献，若有冒犯，望请见谅。
如需删除与您权益相关的代码，请与我联系。
