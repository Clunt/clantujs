# Clantu.js
## Intro
## Installation
## Examples
## Api
### c.router(path, callback[, callback ...])
### c.router.exit(path, callback[, callback ...])
### c.router.error(path, callback[, callback ...])
### c.router.redirect(fromPath, toPath[, force])
### c.router.alias(fromPath, toPath)

### c.start([options])
启动应用

### c.stop()
停止应用

### c.show(path)
匹配新的路由，浏览器URL不改变

### c.go(path)
导航到一个新的路由，浏览器URL改变，增加一条历史记录

### c.replace(path[, force])
导航到一个新的路由，浏览器URL改变，不增加历史记录

### Route
### Context
## Tests
