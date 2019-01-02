let fs = require('fs')
let http = require('http')
let path = require('path')
let context = require('./context')
let request = require('./request')
let response = require('./response')
let EventEmitter = require('events')
let Stream = require('stream')


class koa extends EventEmitter{

    constructor(){
        super()
        this.ctx = Object.create(context)
        this.request = Object.create(request)
        this.response = Object.create(response)
        this.middlewares = []
    }

    use (fn) {
        this.middlewares.push(fn)
    }
    createContext (req,res) {
        let ctx = this.ctx
        ctx.request = this.request;
        ctx.req = ctx.request.req = req; // 请求相关的
        ctx.response = this.response;
        ctx.res = ctx.response.res = res; // 响应相关的
        return ctx;
    }
    compose () {
         let dispath = (index) => {
            if (this.middlewares.length === index) return Promise.resolve()
            return Promise.resolve(this.middlewares[index](this.ctx,()=>dispath(index + 1)))
        }
        return dispath(0)
    }
    handelRequest (req,res) {
        let ctx = this.createContext(req,res)
        let fn = this.compose()
        fn.then(()=>{
            if (!ctx.body) {
                res.statusCode = 404
                res.end('Not Fount')
            } else if(ctx.body instanceof Stream) {
                res.setHeader('Content-Type','text/html;charset=utf8')
                ctx.body.pipe(res)
            } else if(typeof ctx.body == "object"){
                res.setHeader('Content-Type','application/json;charset=utf-8')
                res.end(JSON.stringify(ctx.body))
            } else {
                res.end(ctx.body)
            }
        }).catch((err)=>{
            this.emit('error',err)
        })
    }

    listen(port) {
        http.createServer(this.handelRequest.bind(this)).listen(port)
    }
}

module.exports = koa
