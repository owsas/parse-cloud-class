// @ts-check
import * as Parse from 'parse/node';
import * as is from 'is';

/**
 * Interface that allows easy testing
 * without having to create a Parse.Cloud.BeforeSaveRequest or
 * others
 */
export interface IProcessRequest {
  object: Parse.Object;
  user?: Parse.User;
  master?: boolean;
}

/**
 * Mock before find request for testing
 */
export interface IBeforeFindRequest {
  query: Parse.Query;
}

/**
 * Interface that allows easy testing
 * without having to create a Parse Cloud Response
 */
export interface IProcessResponse {
  success: ((obj: any) => void);
  error: ((e: any) => void);
}

export interface IConstructorParams {
  requiredKeys?: string[];
  defaultValues?: {[key: string]: any};
  minimumValues?: {[key: string]: number};
  maximumValues?: {[key: string]: number};
  immutableKeys?: string[];
}

/**
 * Interface that describes a configuration object
 */
export interface ICloudClassObject extends IConstructorParams {
  addons?: ParseCloudClass[];

  beforeFind?: (
    req: Parse.Cloud.BeforeFindRequest,
  ) => Parse.Query;

  processBeforeSave?: (
    req: Parse.Cloud.BeforeSaveRequest,
  ) => Promise<Parse.Object>;

  afterSave?: (
    req: Parse.Cloud.AfterSaveRequest,
  ) => Promise<Parse.Object>;

  processBeforeDelete?: (
    req: Parse.Cloud.BeforeSaveRequest,
  ) => Promise<Parse.Object>;

  afterDelete?: (
    req: Parse.Cloud.AfterSaveRequest,
  ) => Promise<Parse.Object>;
}

/**
 * Defines the methods every ParseCloudClass should have
 */
export interface IParseCloudClass {

  beforeFind(
    req: Parse.Cloud.BeforeFindRequest,
  ): Parse.Query;

  processBeforeSave (
    req: Parse.Cloud.BeforeSaveRequest | IProcessRequest,
  ): Promise<Parse.Object>;

  beforeSave(
    req: Parse.Cloud.BeforeSaveRequest | IProcessRequest,
    res?: Parse.Cloud.BeforeSaveResponse | IProcessResponse,
  ): Promise<Parse.Object>;

  afterSave (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise<Parse.Object>;

  processBeforeDelete (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise<Parse.Object>;

  beforeDelete(
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
    res?: Parse.Cloud.BeforeDeleteResponse | IProcessResponse,
  ): Promise<Parse.Object>;

  afterDelete (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise<Parse.Object>;

}

/**
 * Handles beforeSave and beforeDelete execution logic for any Parse class
 * on the database
 */
export default class ParseCloudClass implements IParseCloudClass {

  requiredKeys: string[] = [];
  defaultValues: {[key: string]: any} = {};
  minimumValues: {[key: string]: number} = {};
  maximumValues: {[key: string]: number} = {};
  addons: ParseCloudClass [] = [];
  immutableKeys: string[] = [];

  constructor (params?: IConstructorParams) {
    if (params) {
      if (params.requiredKeys) {
        this.requiredKeys = params.requiredKeys;
      }

      if (params.defaultValues) {
        this.defaultValues = params.defaultValues;
      }

      if (params.minimumValues) {
        this.minimumValues = params.minimumValues;
      }

      if (params.maximumValues) {
        this.maximumValues = params.maximumValues;
      }

      if (params.immutableKeys) {
        this.immutableKeys = params.immutableKeys;
      }
    }

    this.afterSave = this.afterSave.bind(this);
    this.afterDelete = this.afterDelete.bind(this);
    this.beforeDelete = this.beforeDelete.bind(this);
    this.beforeFind = this.beforeFind.bind(this);
    this.beforeSave = this.beforeSave.bind(this);
    this.useAddon = this.useAddon.bind(this);
  }

  /**
   * Get a class configuration based
   * on a JSON object
   * @param object
   */
  static fromObject (object: ICloudClassObject): ParseCloudClass {
    // Create a class that extends the ParseCloudClass and adds behaviours
    // set in the object
    class ExtendedCloudClass extends ParseCloudClass {
      beforeFind(req: Parse.Cloud.BeforeFindRequest): Parse.Query {
        let query = super.beforeFind(req);

        if (object.beforeFind) {
          query = object.beforeFind.bind(this)(req);
        }

        return query;
      }

      async processBeforeSave (
        req: Parse.Cloud.BeforeSaveRequest | IProcessRequest,
      ): Promise<Parse.Object> {
        let obj = await super.processBeforeSave(req);

        if (object.processBeforeSave) {
          obj =  await object.processBeforeSave.bind(this)(req);
        }

        return obj;
      }

      async afterSave(req: Parse.Cloud.AfterSaveRequest): Promise<Parse.Object> {
        let obj = await super.afterSave(req);

        if (object.afterSave) {
          obj = await object.afterSave.bind(this)(req);
        }

        return obj;
      }

      async processBeforeDelete (
        req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
      ): Promise<Parse.Object> {
        let obj = await super.processBeforeDelete(req);

        if (object.processBeforeDelete) {
          obj =  await object.processBeforeDelete.bind(this)(req);
        }

        return obj;
      }

      async afterDelete(
        req: Parse.Cloud.AfterDeleteRequest,
      ): Promise<Parse.Object> {
        let obj = await super.afterDelete(req);

        if (object.afterDelete) {
          obj = await object.afterDelete.bind(this)(req);
        }

        return obj;
      }
    }

    const cloudClass = new ExtendedCloudClass(object);

    // Attach the addons
    if (object.addons && object.addons.length) {
      object.addons.forEach((addon) => {
        cloudClass.useAddon(addon);
      });
    }

    return cloudClass;
  }

  /**
   * Configures a class for working on Parse Cloud
   * @param P The Parse Cloud Object
   * @param className The name of the class
   * @param cloudClass The extended class to configure
   */
  static configureClass (P: any, className: string, instance: ParseCloudClass): void {
    P.Cloud.beforeFind(className, instance.beforeFind);

    P.Cloud.beforeSave(className, instance.beforeSave);

    P.Cloud.afterSave(className, instance.afterSave);

    P.Cloud.beforeDelete(className, instance.beforeDelete);

    P.Cloud.afterDelete(className, instance.afterDelete);
  }

  /**
   * Checks that an object has the required keys, and
   * throws an error if not
   * @param obj
   * @param requiredKeys
   * @throws {Error} If any of the required keys is not met
   */
  static checkRequiredKeys (obj: Parse.Object, requiredKeys: string[]): void {
    requiredKeys.forEach((requiredParam) => {
      const currentValue = obj.get(requiredParam);
      if (! currentValue
        || is.array(currentValue) && !currentValue.length
      ) {
        throw new Parse.Error(-1, `Params ${requiredKeys.join(', ')} are needed`);
      }
    });
  }

  /**
   * Sets the default values to the object given
   * @param obj
   * @param defaultValues
   * @return {Parse.Object}
   */
  static setDefaultValues (obj: Parse.Object, defaultValues: any): Parse.Object {
    const object = obj.clone();

    for (const key of Object.keys(defaultValues)) {
      if (is.undefined(object.get(key))) {
        object.set(key, defaultValues[key]);
      }
    }

    return object;
  }

  /**
   * Checks that the object has certain minimum values
   * @param object
   * @param minimumValues
   */
  static checkAndCorrectMinimumValues (
    object: Parse.Object,
    minimumValues: {[key: string]: number} = {},
  ): Parse.Object {
    const obj = object.clone();

    for (const key in minimumValues) {
      if (is.undefined(obj.get(key)) || (obj.get(key) < minimumValues[key])) {
        obj.set(key, minimumValues[key]);
      }
    }

    return obj;
  }

  /**
   * Checks that the object has certain minimum values
   * @param object
   * @param maximumValues
   */
  static checkAndCorrectMaximumValues (
    object: Parse.Object,
    maximumValues: {[key: string]: number} = {},
  ): Parse.Object {
    const obj = object.clone();

    for (const key in maximumValues) {
      if ((obj.get(key) > maximumValues[key])) {
        obj.set(key, maximumValues[key]);
      }
    }

    return obj;
  }

  /**
   * Checks keys that should not be editable
   * if they are not explicitly changed with the master key
   * @param obj
   * @param isMaster
   */
  checkImmutableKeys(obj: Parse.Object, isMaster: boolean) {
    this.immutableKeys.forEach((key) => {
      if (obj.dirtyKeys().indexOf(key) !== -1 && !isMaster) {
        throw new Parse.Error(-1, `${key} cannot be modified`);
      }
    });
  }

  /**
   * Pushes an addon to the addon list
   * @param addon
   */
  useAddon(addon: ParseCloudClass) {
    this.addons.push(addon);
  }

  /**
   * Executes some code before finding
   * elements of this class
   * @param req
   */
  beforeFind (
    req: Parse.Cloud.BeforeFindRequest | IBeforeFindRequest,
  ): Parse.Query {
    return req.query;
  }

  /**
   * Executes the instance processBefore save function
   * and handles the success or errors that may occur
   * @param req
   * @param res
   * @return A promise that says if everything went fine or not
   */
  async beforeSave (
    req: Parse.Cloud.BeforeSaveRequest | IProcessRequest,
    res?: Parse.Cloud.BeforeSaveResponse | IProcessResponse,
  ): Promise<Parse.Object> {
    try {
      // Trigger the addons to determine if the object can be saved
      for (const addon of this.addons) {
        req.object = await addon.processBeforeSave(req);
      }

      req.object = await this.processBeforeSave(req);
      if (res && res.success) {
        (res as any).success(req.object);
      } else {
        return req.object;
      }
    } catch (e) {
      const message = e.message || JSON.stringify(e);
      if (res && res.error) {
        res.error(message);
      } else {
        throw e;
      }
    }
  }

  /**
   * Does all the processing to determine if a certain object
   * can be saved or not
   * @param req
   * @return The object, altered with the default values, minimum values, and others
   */
  async processBeforeSave (
    req: Parse.Cloud.BeforeSaveRequest | IProcessRequest,
  ): Promise< Parse.Object> {
    let obj = req.object;
    obj = ParseCloudClass.setDefaultValues(obj, this.defaultValues);
    obj = ParseCloudClass.checkAndCorrectMinimumValues(obj, this.minimumValues || {});
    obj = ParseCloudClass.checkAndCorrectMaximumValues(obj, this.minimumValues || {});
    ParseCloudClass.checkRequiredKeys(obj, this.requiredKeys);
    this.checkImmutableKeys(obj, req.master);

    return obj;
  }

  /**
   * Default afterSave saves an analytic of creation that references the object
   * @param req
   * @return The object that was saved
   */
  async afterSave (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise< Parse.Object > {

    // Trigger the addons for the beforeSave process
    for (const addon of this.addons) {
      req.object = await addon.afterSave(req);
    }

    return req.object;
  }

  /**
   * Does all the processing to determine if this
   * object can be deleted or not
   * @param req
   * @return The object that is about to be deleted
   */
  async processBeforeDelete (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise< Parse.Object > {
    return req.object;
  }

  /**
   * Executes the processBeforeDelete function
   * and returns if it was ok or not
   * @param req
   * @param res
   * @return A promise that states if everything went fine or not
   */
  async beforeDelete (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
    res?: Parse.Cloud.BeforeDeleteResponse | IProcessResponse,
  ): Promise<Parse.Object> {
    try {
      // Trigger the addons to determine if the object can be deleted
      for (const addon of this.addons) {
        req.object = await addon.processBeforeDelete(req);
      }

      req.object = await this.processBeforeDelete(req);
      if (res) {
        (res as any).success(req.object);
      } else {
        return req.object;
      }
    } catch (e) {
      const message = e.message || JSON.stringify(e);
      if (res && res.error) {
        res.error(message);
      } else {
        throw e;
      }
    }
  }

  /**
   * Executes something after the object was deleted
   * successfully
   * @param req
   */
  async afterDelete (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise<Parse.Object> {
    // Trigger the addons to determine what happens after
    // the object has been deleted
    for (const addon of this.addons) {
      req.object = await addon.afterDelete(req);
    }

    return req.object;
  }

}
