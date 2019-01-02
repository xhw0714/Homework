let url = require('url')

let request = {
    get url() {
        return this.req.url
    },
    get path() {
        let {pathname} = url.parse(this.req.url)
        return pathname
    }
}

module.exports = request
