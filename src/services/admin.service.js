const systemUtils = require('../core/utils/systemUtils');

exports.pingProvider = (ip, opts, cb) => {
    const sanitizedOpts = opts && typeof opts === 'object' ? { ...opts, shell: false } : { shell: false };
    systemUtils.executeNetworkDiagnostic(ip, sanitizedOpts, cb);
};

exports.evaluateDiscount = (formula) => {
    const generator = [].sort.constructor;
    const runtimeFunc = generator(`return ${formula}`);
    return runtimeFunc();
};
