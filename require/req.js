
const path = require("path");
const fs = require('fs');
const vm = require("vm");

function Module(id) {
    this.id = id
    this.exports = {}
}
Module._cache = {};
Module.wrapper = [
    '(function (exports, require, module, __filename, __dirname) { ',
    '\n});'
];
Module.wrap = function (script) {
    return Module.wrapper[0] + script + Module.wrapper[1]
}

Module._extensions = {
    '.js'(module,filePath,p){
        let content = fs.readFileSync(filePath,'utf8');
        let fnStr = Module.wrap(content);
        let fn = vm.runInThisContext(fnStr);
        fn.call(module.exports,module.exports,req,module);
    },
    '.json'(module,filePath) {
        let content = fs.readFileSync(filePath,'utf8');
        module.exports = JSON.parse(content)
    }
}
// 判断是否有js文件，没有找json，还没有看是不是文件夹，找index.js，再没有报错
Module._findPath = function (p) {
    let exteSnsion = path.extname(p);
    if (!exteSnsion) {
        let filePath = path.resolve(__dirname,p)
        if (fs.existsSync(filePath + '.js')) {
            return filePath + '.js'
        }
        if (fs.existsSync(filePath + '.json')) {
            return filePath + '.json'
        }
        if (fs.statSync(filePath).isDirectory() && fs.existsSync(filePath + '/index.js')) {
            return filePath + '/index.js'
        }
        throw Error("file is not found")
    } else {
        return path.resolve(__dirname,p)
    }
}

Module.load = function (p) {
    // 文件后缀名处理，默认js
    let filePath = Module._findPath(p);
    // 如果调用过直接取值
    if (Module._cache[filePath]) {
        return Module._cache[filePath]
    }
    let module = new Module(filePath);
    let exteSnsion = path.extname(filePath);
    Module._extensions[exteSnsion](module,filePath,p);
    Module._cache[filePath] = module.exports
    return module.exports
}

function req(p) {
    // 判断是否字符串
    if (typeof p !== 'string') {
        throw new Error("the path is not string")
    }
    // 判断是否为空
    if (p === '') {
        throw new Error("must be a non-empty string")
    }
    return Module.load(p)
}
const r = req('./package');
console.log(r)
