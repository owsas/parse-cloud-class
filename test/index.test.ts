// @ts-check
import * as Parse from 'parse/node';
import { ParseCloudClass } from '../src/index';

class ExtendedParseClass extends ParseCloudClass {
  requiredKeys = ['name', 'creditCard', 'description'];
  defaultValues = {
    views: 0,
    otherValue: ['a', 'b', 'c'],
  };
}

const OBJ_OK = new Parse.Object('Test');
OBJ_OK.set('name', 'hello');
OBJ_OK.set('creditCard', '213123123');
OBJ_OK.set('description', 'hola como estas este es UN Mensaje!!!');


describe('#configureClass', () => {
  const parseMock = {
    Cloud: {
      beforeFind: jest.fn(),
      beforeSave: jest.fn(),
      afterSave: jest.fn(),
      beforeDelete: jest.fn(),
      afterDelete: jest.fn(),
    },
  };

  const instance = new ExtendedParseClass();

  // Now we configure the class
  ParseCloudClass.configureClass(parseMock, 'Test', instance);  

  test('should configure #beforeFind correctly', () => {
    expect(parseMock.Cloud.beforeFind)
      .toHaveBeenCalledWith('Test', instance.beforeFind);
  });

  test('should configure #beforeSave correctly', () => {
    expect(parseMock.Cloud.beforeSave)
      .toHaveBeenCalledWith('Test', instance.beforeSave);
  });

  test('should configure #afterSave correctly', () => {
    expect(parseMock.Cloud.afterSave)
      .toHaveBeenCalledWith('Test', instance.afterSave);
  });

  test('should configure #beforeDelete correctly', () => {
    expect(parseMock.Cloud.beforeDelete)
      .toHaveBeenCalledWith('Test', instance.beforeDelete);
  });

  test('should configure #afterDelete correctly', () => { 
    expect(parseMock.Cloud.afterDelete)
      .toHaveBeenCalledWith('Test', instance.afterDelete);
  });

});

describe('#useAddon', () => {
  const instance = new ExtendedParseClass();
  const addon = new ParseCloudClass();

  test('should add the addon correctly to the list of addons', () => {
    instance.useAddon(addon);
    expect(instance.addons[0]).toEqual(addon);
  });

});

describe('#checkRequiredKeys', () => {
  test('should throw if keys are not set', () => {
    expect(() => {
      const obj = new Parse.Object('Test');
      ParseCloudClass.checkRequiredKeys(obj, ['name', 'description']);
    }).toThrow();
  });

  test('should not throw if keys are set', () => {
    expect(() => {
      const obj = new Parse.Object('Test');
      obj.set('name', 'hola');
      obj.set('description', 'como vas');
      ParseCloudClass.checkRequiredKeys(obj, ['name', 'description']);
    }).not.toThrow();
  });
});

describe('#setDefaultValues', () => {
  test('should set the default values', () => {
    const obj = new Parse.Object('Test');
    const defaultValues = {
      name: 'abc',
      description: 'long description...',
      categories: ['abc', 'def'],
    };

    const result = ParseCloudClass.setDefaultValues(obj, defaultValues);

    expect(result.get('name')).toEqual(defaultValues.name);
    expect(result.get('description')).toEqual(defaultValues.description);
    expect(result.get('categories')).toEqual(defaultValues.categories);
  });
});

describe('#checkAndCorrectMinimumValues', () => {
  const obj = new Parse.Object('Test');
  const minimumValues = {
    views: 0,
    likes: 1,
  };

  it('should set the minimum values if not set', () => {
    const response = ParseCloudClass.checkAndCorrectMinimumValues(obj, minimumValues);
    expect(response.get('views')).toEqual(0);
    expect(response.get('likes')).toEqual(1);
  });

  it('should correct the values', () => {
    const obj = new Parse.Object('Test');
    obj.set('views', -10);
    obj.set('likes', -30);

    const response = ParseCloudClass.checkAndCorrectMinimumValues(obj, minimumValues);

    expect(response.get('views')).toEqual(0);
    expect(response.get('likes')).toEqual(1);
  });

});


describe('#beforeFind', () => {
  test('should not alter the query by default', () => {
    const query = new Parse.Query('Test');
    const instance = new ExtendedParseClass();
    const result = instance.beforeFind({ query });
    expect(result).toEqual(query);
  });
});

describe('#beforeSave', () => {

  test('should save with no problems', async () => {
    const CLASSNAME = 'Test';
    const obj = new ParseCloudClass({
      requiredKeys: ['name'],
      defaultValues: {
        name: 'hello',
      },
    });

    expect(obj.beforeSave).toBeTruthy();

    await obj.beforeSave({
      object: new Parse.Object(CLASSNAME),
      user: new Parse.User(),
    },                   {
      success: (returnedObject: Parse.Object) => {
        expect(returnedObject.className).toEqual(CLASSNAME);
      },
      error: (e) => {
        expect(e).not.toBeDefined();
      },
    });
  });

  // tslint:disable-next-line
  test('should save with no problems and return the object if there is no response parameter', async () => {
    const CLASSNAME = 'Test';
    const obj = new ParseCloudClass({
      requiredKeys: ['name'],
      defaultValues: {
        name: 'hello',
      },
    });

    expect(obj.beforeSave).toBeTruthy();

    const returnedObject = await obj.beforeSave({
      object: new Parse.Object(CLASSNAME),
      user: new Parse.User(),
    });

    expect(returnedObject.className).toEqual(CLASSNAME);
  });

  test('should not save if required keys are not met', async () => {
    const CLASSNAME = 'Test';
    const obj = new ParseCloudClass({
      requiredKeys: ['name'],
      defaultValues: {
      },
    });

    await obj.beforeSave({
      object: new Parse.Object(CLASSNAME),
      user: new Parse.User(),
    },                   {
      success: (returnedObject: Parse.Object) => {
        expect(returnedObject).not.toBeDefined();
      },
      error: (e) => {
        expect(e).toBeDefined();
      },
    });
  });

  // tslint:disable-next-line
  test('should not save if required keys are not met, and should throw if there is no response parameter', async () => {
    const CLASSNAME = 'Test';
    const obj = new ParseCloudClass({
      requiredKeys: ['name'],
      defaultValues: {
      },
    });
    let error;

    try {
      await obj.beforeSave({
        object: new Parse.Object(CLASSNAME),
        user: new Parse.User(),
      });
    } catch (e) {
      error = e;
    } finally {
      expect(error).toBeDefined();
    }
  });

  test('should have called the addon\'s processBeforeSave', async () => {
    const classInstance = new ParseCloudClass();
    const addon = new ParseCloudClass();

    // Here we set the class to use the given addon
    classInstance.useAddon(addon);

    const spyAddon = jest.spyOn(addon, 'processBeforeSave');
    await classInstance.beforeSave({
      object: OBJ_OK,
    });
    expect(spyAddon).toHaveBeenCalledTimes(1);
  });

});

describe('#beforeDelete', () => {
  test('should delete with no problems', async () => {
    const CLASSNAME = 'Test';
    const obj = new ParseCloudClass({
      requiredKeys: ['name'],
      defaultValues: {
        name: 'hello',
      },
    });

    expect(obj.beforeDelete).toBeTruthy();

    await obj.beforeDelete({
      object: new Parse.Object(CLASSNAME),
      user: new Parse.User(),
    },                     {
      success: (returnedObject: Parse.Object) => {
        expect(returnedObject.className).toEqual(CLASSNAME);
      },
      error: (e) => {
        expect(e).not.toBeDefined();
      },
    });
  });

  // tslint:disable-next-line
  test('should delete with no problems and return the object if there is no response parameter', async () => {
    const CLASSNAME = 'Test';
    const obj = new ParseCloudClass({
      requiredKeys: ['name'],
      defaultValues: {
        name: 'hello',
      },
    });

    expect(obj.beforeDelete).toBeTruthy();

    const returnedObject = await obj.beforeDelete({
      object: new Parse.Object(CLASSNAME),
      user: new Parse.User(),
    });

    expect(returnedObject.className).toEqual(CLASSNAME);
  });

  test('should not delete if something goes wrong', async () => {
    const CLASSNAME = 'Test';
    const obj = new ParseCloudClass({
      requiredKeys: ['name'],
      defaultValues: {
      },
    });

    const spyDelete = jest.spyOn(obj, 'processBeforeDelete');
    spyDelete.mockImplementation(async () => { throw new Error();});

    await obj.beforeDelete({
      object: new Parse.Object(CLASSNAME),
      user: new Parse.User(),
    },                     {
      success: (returnedObject: Parse.Object) => {
        expect(returnedObject).not.toBeDefined();
      },
      error: (e) => {
        expect(e).toBeDefined();
      },
    });
  });
  
  // tslint:disable-next-line
  test('should not delete if something goes wrong, and throw if there is no response parameter', async () => {
    const CLASSNAME = 'Test';
    const obj = new ParseCloudClass({
      requiredKeys: ['name'],
      defaultValues: {
      },
    });
    let error;

    const spyDelete = jest.spyOn(obj, 'processBeforeDelete');
    spyDelete.mockImplementation(async () => { throw new Error();});

    try {
      await obj.beforeDelete({
        object: new Parse.Object(CLASSNAME),
        user: new Parse.User(),
      });
    } catch (e) {
      error = e;
    } finally {
      expect(error).toBeDefined();
    }
  });

  test('should have called the addon\'s processBeforeDelete', async () => {
    const classInstance = new ParseCloudClass();
    const addon = new ParseCloudClass();
  
    // Here we set the class to use the given addon
    classInstance.useAddon(addon);

    const spyAddon = jest.spyOn(addon, 'processBeforeDelete');
    await classInstance.beforeDelete({
      object: OBJ_OK,
    });
    expect(spyAddon).toHaveBeenCalledTimes(1);
  });
  
});

describe('#processBeforeSave', () => {

  const classInstance = new ParseCloudClass({
    requiredKeys: ['creditCard', 'name', 'description'],
    defaultValues: {
      name: 'hello',
    },
    minimumValues: {},
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should restrict creation without required creditCard', () => {
    const obj = new Parse.Object('Test');
    obj.set('description', '123123');
    obj.set('name', 'hello');

    return classInstance.processBeforeSave({
      object: obj,
    }).catch((e) => {
      expect(e).toBeTruthy();
    });
  });

  test('should restrict creation without required name', () => {
    const obj = new Parse.Object('Test');
    obj.set('creditCard', '123123');
    obj.set('description', '123123');

    return classInstance.processBeforeSave({
      object: obj,
    }).catch((e) => {
      expect(e).toBeTruthy();
    });
  });

  test('should restrict creation without required description', () => {
    const obj = new Parse.Object('Test');
    obj.set('creditCard', '123123');
    obj.set('name', 'hello');

    return classInstance.processBeforeSave({
      object: obj,
    }).catch((e) => {
      expect(e).toBeTruthy();
    });
  });

  test('should allow creation with all required keys set', async () => {
    const response = await classInstance.processBeforeSave({
      object: OBJ_OK,
    });
    expect(response).toBeTruthy();
  });

  test('should have set the default values', async () => {
    const response = await classInstance.processBeforeSave({
      object: OBJ_OK,
    });

    for (const key in classInstance.defaultValues) {
      const actual = response.get(key);
      expect(actual).toEqual(classInstance.defaultValues[key]);
    }
  });
  
  test('should throw an error if an immutable key is changed', async () => {
    const obj = new Parse.Object('Test');
    obj.set('test', 1);
    obj.set('test2', 2);
    
    const instance = new ParseCloudClass({ immutableKeys: ['test', 'test2'] });
    let error;
    
    try {
      await instance.processBeforeSave({ object: obj });
    } catch (e) {
      error = e;
    } finally {
      expect(error).toBeDefined();
      expect(() => {
        throw error;
      }).toThrow('test cannot be modified');
    }
  });
  
  test('should not throw an error if an immutable key is changed with the master key', async () => {
    const obj = new Parse.Object('Test');
    obj.set('test', 1);
    obj.set('test2', 2);
    
    const instance = new ParseCloudClass({ immutableKeys: ['test', 'test2'] });
    await instance.processBeforeSave({ object: obj, master: true });
  });
});

describe('#afterSave', () => {
  const classInstance = new ParseCloudClass({
    requiredKeys: ['name'],
    defaultValues: {
      name: 'hello',
    },
  });
  
  const addon = new ParseCloudClass();
  
  // Here we set the class to use the given addon
  classInstance.useAddon(addon);
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should return the same object by default', async () => {
    const response = await classInstance.afterSave({
      object: OBJ_OK,
    });
    
    expect(response.toJSON()).toEqual(OBJ_OK.toJSON());
  });
  
  test('should have called the addon\'s afterSave', async () => {
    const spyAddon = jest.spyOn(addon, 'afterSave');
    await classInstance.afterSave({
      object: OBJ_OK,
    });
    expect(spyAddon).toHaveBeenCalledTimes(1);
  });
});

describe('#processBeforeDelete', () => {
  const classInstance = new ExtendedParseClass();
  
  test('should return the same object by default', async () => {
    const response = await classInstance.processBeforeDelete({
      object: OBJ_OK,
    });
    
    expect(response.toJSON()).toEqual(OBJ_OK.toJSON());
  });
});

describe('#afterDelete', () => {
  const classInstance = new ParseCloudClass({
    requiredKeys: ['name'],
    defaultValues: {
      name: 'hello',
    },
  });
  
  const addon = new ParseCloudClass();
  
  // Here we set the class to use the given addon
  classInstance.useAddon(addon);
  
  test('should return the same object by default', async () => {
    const response = await classInstance.afterDelete({
      object: OBJ_OK,
    });
    
    expect(response.toJSON()).toEqual(OBJ_OK.toJSON());
  });
  
  test('should have called the addon\'s afterDelete', async () => {
    const spyAddon = jest.spyOn(addon, 'afterDelete');
    const response = await classInstance.afterDelete({
      object: OBJ_OK,
    });
    expect(spyAddon).toHaveBeenCalledTimes(1);
  });
});

describe('Working with addons', () => {
  const testFn = jest.fn();
  
  class ExtendedClass2 extends ParseCloudClass {
    async processBeforeSave(req: Parse.Cloud.BeforeSaveRequest) {
      const object = await super.processBeforeSave(req);
      testFn(3);
      object.set('test', true);
      return object;
    }
  }

  class Addon1 extends ParseCloudClass {
    async processBeforeSave(req: Parse.Cloud.BeforeSaveRequest) {
      req.object.set('addon1', true);
      testFn(1);
      return req.object;
    }
  }

  class Addon2 extends ParseCloudClass {
    async processBeforeSave(req: Parse.Cloud.BeforeSaveRequest) {
      req.object.set('addon2', true);
      testFn(2);
      return req.object;
    }
  }

  const instance = new ExtendedClass2();
  const addon1 = new Addon1();
  const addon2 = new Addon2();

  // Create the addons
  instance.useAddon(addon1);
  instance.useAddon(addon2);

  // Create the object
  let obj = new Parse.Object('TestObject');

  test('executing an instance function', async () => {
    obj = await instance.beforeSave({ object: obj } as any);
  });

  test('instance should have both addons', () => {
    expect(instance.addons).toEqual([addon1, addon2]);
  });

  test('should have called the testFn 3 times', () => {
    expect(testFn).toHaveBeenCalledTimes(3);
    expect(testFn).toHaveBeenCalledWith(1);
    expect(testFn).toHaveBeenCalledWith(2);
    expect(testFn).toHaveBeenCalledWith(3);
  });

  test('should have executed all addon functions', () => {  
    // Expect the object to have been mutated
    expect(obj.get('test')).toBe(true);

    // Expect all addons to have been called
    expect(obj.get('addon1')).toBe(true);
    expect(obj.get('addon2')).toBe(true);
  });

});
