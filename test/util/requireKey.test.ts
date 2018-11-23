import { ParseCloudClass } from '../../src';
import requireKey from '../../src/decorators/requireKey';

@requireKey('testKey', 'testKey38')
class TestClass extends ParseCloudClass {
}

test('Given a new instance: should require the expected keys', () => {
  const instance = new TestClass();
  expect(instance.requiredKeys).toEqual(['testKey', 'testKey38']);
});
