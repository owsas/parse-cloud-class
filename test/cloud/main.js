const { ParseCloudClass } = require('../../src');
const TestAddon = require('./TestAddon');

class Test extends ParseCloudClass {
  async processBeforeSave(req) {
    const obj = await super.processBeforeSave(req);
    req.log.info('testing');
    obj.set('nice', true);
    return obj;
  }
}

const instance = new Test();
instance.useAddon(new TestAddon());

ParseCloudClass.configureClass(Parse, 'Test', instance); 
