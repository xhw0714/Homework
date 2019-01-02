let response = {
    get body() {
        this.res.statusCode = 200
        return this._body
    },
    set body(val) {
        this._body = val
    }
}

module.exports = response
