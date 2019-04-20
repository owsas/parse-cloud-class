const { ParseCloudClass } = require('../../');

/**
 * Sets the key 'testAddonProcessed' to true
 */
class TestAddon extends ParseCloudClass {
  async processBeforeSave(request) {
    const obj = await super.processBeforeSave(request);
    obj.set('testAddonProcessed', true);
    return obj;
  }
}

module.exports = TestAddon;
