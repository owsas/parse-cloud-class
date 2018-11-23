/**
 * Adds keys to the array of requiredKeys in the class
 * @param keys The key or keys that are required
 */
export default function requireKey(...keys: string[]) {
  // tslint:disable-next-line
  return function <T extends { new(...args: any[]): { requiredKeys: string[] } }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        this.requiredKeys.push(...keys);
      }
    };
  };
}
