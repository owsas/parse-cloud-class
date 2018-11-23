import ParseCloudClass from '../ParseCloudClass';
import requireLogin from '../util/requireLogin';

/**
 * Adds keys to the array of requiredKeys in the class
 * @param keys The key or keys that are required
 */
export default function requireLoginDecorator() {
  // tslint:disable-next-line
  return function <T extends { new(...args: any[]): ParseCloudClass }>(ExtendedClass: T) {
    return class extends ExtendedClass {
      public async processBeforeSave(req: Parse.Cloud.BeforeSaveRequest) {
        // require login
        requireLogin(req);

        // return the request's object
        return super.processBeforeSave(req);
      }

      public async processBeforeDelete(req: Parse.Cloud.BeforeDeleteRequest) {
        // require login
        requireLogin(req);

        // return the request's object
        return super.processBeforeDelete(req);
      }
    };
  };
}
