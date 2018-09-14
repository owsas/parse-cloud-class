const { ParseCloudClass } = require('../../src');

class Test extends ParseCloudClass {
  async processBeforeSave(req) {
    const obj = await super.processBeforeSave(req);
    req.log.info('testing');
    obj.set('nice', true);
    return obj;
  }
}

ParseCloudClass.configureClass(Parse, 'Test', new Test()); 
