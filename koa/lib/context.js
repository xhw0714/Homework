let context = {}
function defineGetter (key,property) {
    context.__defineGetter__(property,function () {
        return this[key][property]
    })
}
function defineSetter (key,property) {
    context.__defineSetter__(property,function (val) {
        this[key][property] = val
    })
}

defineGetter('request','path');
defineGetter('request','url');
// ctx.body => ctx.response.body;
defineGetter('response','body');
// ctx.body = '100'  ctx.response.body = '100'
defineSetter('response','body');

module.exports = context
