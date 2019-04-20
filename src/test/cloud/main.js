const { ParseCloudClass } = require('../../');
const TestAddon = require('./TestAddon');
const AnalyticAddon = require('./AnalyticAddon');

class Test extends ParseCloudClass {
  async processBeforeSave(req) {
    const obj = await super.processBeforeSave(req);
    obj.set('nice', true);
    return obj;
  }
}

const instance = new Test();
instance.useAddon(new AnalyticAddon());
instance.useAddon(new TestAddon());

ParseCloudClass.configureClass(Parse, 'Test', instance);
