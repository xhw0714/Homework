class Promise {
    constructor (executor) {
        this.status = 'pending'
        this.value = undefined
        this.reason = undefined
        this.onResolved = []
        this.onRejected = []

        const resolve = (value) => {
            if (this.status === 'pending') {
                this.value = value
                this.status = 'fulfilled'
                this.onResolved.forEach(e => e())
            }
        }

        const reject = (reason) => {
            if (this.status === 'pending') {
                this.reason = reason
                this.status = 'rejected'
                this.onRejected.forEach(e => e())
            }
        }

        try {
            executor(resolve, reject)
        } catch (e) {
            console.log(e)
        }
    }

    resolvePromise (promise2,x,resolved,rejected) {
        if (promise2 === x) {
            throw new TypeError("Chaining cycle detected for Promise #<Promise>")
        }
        let called
        if ((x !== null && typeof x === "object" )|| typeof x === "function") {
            try {
                let then = x.then
                if (typeof then === "function") {
                    then.call(x,(y)=>{
                        if(!called){called = true} else {return}
                        this.resolvePromise(x, y, resolved, rejected)
                    },(r)=>{
                        if(!called){called = true} else {return}
                        rejected(r)
                    })
                }else {
                    resolved(x)
                }
            }catch (e) {
                if(!called){called = true} else {return}
                rejected(e)
            }
        } else {
            resolved(x)
        }
    }

    then (onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === "function"? onFulfilled : (data) => {
            return data
        }
        onRejected = typeof onRejected === "function"? onRejected : (err) => {
            throw err
        }
        let promise2
        promise2 = new Promise((resolved, rejected) => {
            if (this.status === 'fulfilled') {
                setTimeout(()=> {
                   try {
                       let x = onFulfilled(this.value)
                       this.resolvePromise(promise2,x,resolved,rejected)
                   } catch (e) {
                       rejected(e)
                   }
                },0)
            }
            if (this.status === 'rejected') {
                setTimeout(() => {
                   try {
                       let x = onRejected(this.reason)
                       this.resolvePromise(promise2,x,resolved,rejected)
                   } catch (e) {
                       rejected(e)
                   }
                },0)
            }
            if (this.status === 'pending') {
                this.onResolved.push(()=>{
                    setTimeout(()=>{
                       try {
                           let x = onFulfilled(this.value)
                           this.resolvePromise(promise2,x,resolved,rejected)
                       } catch (e) {
                           rejected(e)
                       }
                    },0)
                })
                this.onRejected.push(()=>{
                    setTimeout(()=>{
                       try {
                           let x = onRejected(this.reason)
                           this.resolvePromise(promise2,x,resolved,rejected)
                       }catch (e) {
                           rejected(e)
                       }
                    },0)
                })

            }
        })
        return promise2
    }

    finally (cb) {
        return this.then((data)=>{
            cb()
            return data
        }, (reason) =>{
            cb()
            throw reason
        })
    }

    static resolve (data) {
        return new Promise( (resolved,rejected) => {
            resolved(data)
        })
    }
    static reject (reason) {
        return new Promise((resolved,rejected)=>{
            rejected(reason)
        })
    }

    static all (promises) {
        return new Promise((resolved,rejected) => {
            let i = 0
            let arr = []
            const processData = (index, data) => {
                i++
                arr[index] = data
                if (i === promises.length) {
                    resolved(arr)
                }
            }
            for (let i=0 ;i < promises.length; i++) {
                let p = promises[i]
                if (typeof p.then === "function") {
                    p.then((res)=>{
                        processData(i,res)
                    },rejected)
                } else {
                    processData(i,p)
                }
            }
        })
    }

    static race (promises) {
        return new Promise((resolved,rejected)=>{
            for (let i = 0;i<promises.length;i++){
                let p = promises[i]
                if (typeof p.then === "function") {
                    p.then(resolved,rejected)
                } else {
                    resolved(p)
                }
            }
        })
    }


    static deferred () {
        let dfd = {}
        dfd.promise = new Promise((resolved,rejected) =>{
            dfd.resolve = resolved
            dfd.reject = rejected
        })
        return dfd
    }
}

module.exports = Promise
