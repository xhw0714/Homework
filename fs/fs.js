const fs = require("fs")
const path = require('path')
const {promisify} = require('util')

//同步

function removeDir(p) {
    let statObj = fs.statSync(p);
    if (statObj.isDirectory()) {
        let dirs = fs.readdirSync(p)
        dirs = dirs.map(e =>{
            return path.resolve(p,e)
        })
        dirs.forEach(e => {
            removeDir(e)
        })
        fs.rmdirSync(p)
    } else {
        fs.unlinkSync(p)
    }
}

removeDir('a')

//串行

function removeDir(p,callback) {
    fs.stat(p,function (err,stats) {
        if (stats.isDirectory()) {
            fs.readdir(p,function (err,dirs) {
                dirs = dirs.map(e => path.resolve(p,e))
                let index = 0
                function next(index) {
                    if (dirs.length == index) return fs.rmdir(p,callback)
                    removeDir(dirs[index],() => next(index + 1))
                }
                next(index)
            })
        } else {
            fs.unlink(p,callback)
        }
    })
}


//并行

function removeDir (p,callback) {
    fs.stat(p,function (err,stats) {
        if (stats.isFile()) {
            fs.unlink(p,callback)
        }else{
            fs.readdir(p,function (err,dirs) {
                dirs = dirs.map(e => path.resolve(p,e))
                let index = 0
                if (dirs.length === 0) return fs.rmdir(p,callback);
                function all() {
                    index++;
                    if (dirs.length === index) return fs.rmdir(p,callback)
                }
                dirs.forEach(e=>{
                    removeDir(e,all)
                })
            })
        }
    })
}

//promise

function removeDir(p){
    return new Promise(function (resolve,reject) {
        fs.stat(p,function (err,stats) {
            if (stats.isDirectory()) {
                function next(p) {
                    fs.readdir(p,function (err,dirs) {
                        dirs = dirs.map(e => path.resolve(p,e))
                        dirs = dirs.map(e => removeDir(e))
                        Promise.all(dirs).then(()=>{
                            fs.rmdir(p, resolve)
                        })
                    })
                }
                next(p)
            } else {
                fs.unlink(p,resolve)
            }
        })
    })
}

//async await
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const unlink = promisify(fs.unlink)
const rmdir = promisify(fs.rmdir)

async function removeDir(p) {
    let stats = await stat(p);
    if (stats.isDirectory()){
        let dirs = await readdir(p)
        dirs = dirs.map(e => removeDir(path.resolve(p,e)))
        await Promise.all(dirs)
        await rmdir(p)
    } else {
        await unlink(p)
    }
}


//广度 同步
function wideSync(p){
    let arr = [p]
    let index = 0
    let cur

    while (cur = arr[index++]){
        let stats = fs.statSync(cur)
        if (stats.isDirectory()) {
            let dirs = fs.readdirSync(cur)
            dirs = dirs.map(e => path.resolve(cur,e))
            console.log(p,dirs)
            arr = [...arr,...dirs]
        } else {
            arr.splice(--index,1)
            fs.unlinkSync(cur)
        }
    }
    for (let i = arr.length -1;i>=0;i--) {
        fs.rmdirSync(arr[i])
    }
}


//广度 promise

function wideSync(p) {
    return new Promise(function (resolve,reject) {
        let arr = [p]
        let index = 0
        function next(p){
            if (!p) return cb(index - 1)
            fs.stat(p,function (err,stats) {
                if (err) return reject(err)
                if (stats.isDirectory()) {
                    arr[index] = () => {
                        return new Promise(function (resolve1, reject1) {
                            fs.rmdir(p,resolve1)
                        })
                    }
                    fs.readdir(p,function (err,dirs) {
                        dirs = dirs.map(e=> path.resolve(p,e))
                        arr = [...arr,...dirs]
                        next(arr[++index])
                    })
                } else {
                    arr[index] = () => {
                        return new Promise(function (resolve1, reject1) {
                            fs.unlink(p,resolve1)
                        })
                    }
                    next(arr[++index])
                }
            })
        }
        next(p)
        function cb(index) {
            // console.log(arr[index])
            if (index < 0) return resolve()
            arr[index]().then(()=>{
                cb(index - 1)
            })
        }

    })

}


//广度 async await
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const unlink = promisify(fs.unlink)
const rmdir = promisify(fs.rmdir)

async function wideSync(p) {
    let arr = [p]
    let index = 0
    let cur
    while (cur = arr[index++]) {
        let stats = await stat(cur)
        if(stats.isDirectory()) {
            let dirs = await readdir(cur)
            dirs = dirs.map(e=>path.resolve(cur,e))
            arr = [...arr,...dirs]
        } else {
            arr.splice(--index,1)
            await unlink(cur)
        }
    }
    for (let i = arr.length -1;i>=0;i--) {
        await rmdir(arr[i])
    }
}

wideSync('a').then(res=>{
    console.log("删除成功")
})


