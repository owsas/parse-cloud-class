const Parse = require('parse/node');
const { ParseCloudClass } = require('../../src');

class AnalyticAddon extends ParseCloudClass {
  async afterSave(req) {
    const obj = req.object;

    const analytic = new Parse.Object('Analytic');
    analytic.set(`pointer_${obj.className.toLowerCase()}`, obj);
    
    if(obj.get('testId')) {
      analytic.set('testId', obj.get('testId'));
    }
    
    await analytic.save(null, { useMasterKey: true });

    return obj;
  }
}

module.exports = AnalyticAddon;
