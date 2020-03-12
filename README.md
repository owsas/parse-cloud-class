# REPO MOVED
This repository has been moved to Otherwise's new monorepo :) https://github.com/owsas/opensource/tree/master/packages/parse-cloud-class Enjoy! 

# Parse Cloud Class 

![Travis](https://travis-ci.org/owsas/parse-cloud-class.svg?branch=master) [![codecov](https://codecov.io/gh/owsas/parse-cloud-class/branch/master/graph/badge.svg)](https://codecov.io/gh/owsas/parse-cloud-class)

![Logo](./repo/logo.jpg)  
Photo by [chuttersnap](https://unsplash.com/photos/9AqIdzEc9pY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com)

Travis tests: https://travis-ci.org/owsas/parse-cloud-class/builds 

A new way to define Parse.Cloud events for your classes (DB tables). With this module you can easily:

* Define minimum values for keys on your classes
* Define maximum values for keys on your classes
* Define default values
* Define required keys
* Define immutable keys (only editable with the master key)
* Use addons to easily extend the functionality of your app
* Create new addons and share them with the community
* Customize the default behaviour to your own needs

This module is meant to be used with [Parse](http://docs.parseplatform.org/) and [Parse Server](https://github.com/parse-community/parse-server)

## Installation
`> npm install --save parse-server-addon-cloud-class parse`

__Typescript__: This module comes bundled with Intellisense :)

After installing, please make sure to install also `parse>1.11.0`

## Example
A working example can be found here: https://github.com/owsas/parse-cloud-class-example

## Supported versions
* Parse >1.10.0
* Parse >=2.0
* Parse >=3.0

## New: Configuration with objects
Starting april 2019 (v1.1.0), it's possible to create classes with configuration objects

Example:
```js
const ParseCloudClass = require('parse-server-addon-cloud-class').ParseCloudClass;

// Create a new configuration object to define the class behaviour.
// All attributes are optional
const gamePoint = {
  requiredKeys: ['points'], // all objects saved must have the points attribute
  defaultValues: { points: 20 }, // by default, all new objects will have 20 points (if it was not set at the time of creation) 
  minimumValues: { points: 10 }, // minimum 10 points
  maximumValues: { points: 1000 }, // maximum 1000 points
  immutableKeys: ['points'], // once set, the points can't be changed (only master can do that)
  beforeFind: function(req) {
    // Do something here
    return req.query;
  },
  processBeforeSave: async function(req) {
    // Do something here
    return req.object;
  },
  afterSave: async function(req) {
    // Do something here
    return req.object;
  },
  processBeforeDelete: async function(req) {
    // Do something here
    return req.object;
  },
  afterDelete: async function(req) {
    // Do something here
    return req.object;
  }
}

// Create an instance
const gamePointClass = ParseCloudClass.fromObject(gamePoint);

// Configure the class in the main.js cloud file
ParseCloudClass.configureClass(Parse, 'GamePoint', gamePointClass);
```

As you see, instead of defining `beforeSave`, we use `processBeforeSave`. This is because ParseCloudClass uses the `beforeSave` function to wrap up some extra logic that we may not want to rewrite each time. In the same fashion, we use `processBeforeDelete`.

With this new functionality, the `this` keyword inside the `beforeFind`, `processBeforeSave`, `afterSave`, `processBeforeDelete` and `beforeDelete` functions refers to the instance itself, which means you can access for example `this.requiredKeys`, etc.

## Basic Usage
```js
/*
* This is the main cloud file for Parse
* cloud/main.js
*/

// with normal ES5
const ParseCloudClass = require('parse-server-addon-cloud-class').ParseCloudClass;

// with typescript or ES6
import { ParseCloudClass } from 'parse-server-addon-cloud-class';

const myConfig = new ParseCloudClass({
  // New items will not be created if they have no 'name' set
  requiredKeys: ['name'],
  
  defaultValues: {
    // All new items will have active: true
    active: true,
    // By default, timesShared will be 0
    timesShared: 0,
  },

  minimumValues: {
    // timesShared cannot go below 0
    timesShared: 0,
  },

  // Keys that are only editable by the master key.
  // Trying to edit apiKey without the master key will throw an error
  immutableKeys: ['apiKey'],
});

// Configure your class to use the configuration
ParseCloudClass.configureClass(Parse, 'MyClass', myConfig);
```

When you configure your classes to work with ParseCloudClass, they will be attached the following events
* `beforeFind` 
* `beforeSave`
* `beforeDelete`
* `afterSave`
* `afterDelete`

By default, the only event that is going to do something is the `beforeSave`, that is going to check the `minimumValues`, `defaultValues` and `requiredKeys`

## Extending ParseCloudClass

You can easily extend ParseCloudClass in order to define your custom behaviours. In this case, you must have into account the following two extra methods of a ParseCloudClass:
* `processBeforeSave`: Here you would define your custom behaviour for `beforeSave`
* `processBeforeDelete`: Here you would define your custom behaviour for `beforeDelete`

```js
// myCustomFile.js
import { ParseCloudClass } from 'parse-server-addon-cloud-class';

export class MyCustomClass extends ParseCloudClass {
  /*
  * Here you can define your custom minimumValues, 
  * defaultValues and requiredKeys
  */
  requiredKeys = ['title']

  /**
  * @param req {Parse.Cloud.BeforeSaveRequest}
  */
  async processBeforeSave(req) {
    // Make sure the super class validates the required keys,
    // minimum values, executes the addons, etc
    const object = await super.processBeforeSave(req);

    // write your own code here
    ....

    // make sure to return req.object
    return object;
  }
}
```

You can change the implementation of any method to your needs, but please, call the super class' processBeforeSave if you expect to have requiredKeys checking, minimum values checking, addon functionalities, etcetera.

### Decorators

Parse Cloud Class comes with two decorators that you may use in your own applications. Please keep in mind that you must activate `enableExperimentalDecorators`.

#### requireLogin decorator
It requires all `beforeSave` and `beforeDelete` requests to be made by a registered user or by the master key



#### requireKey decorator
It pushes required keys to the given class when it is initialized

Example:

```ts
@requireKey('myRequiredKey')
export default class MyClass extends ParseClass {
}
```

This is different from defining the required keys in the class' body, because
in that way the previously set required keys would be overriden.

Example: 

``` ts
default class MyClass extends ParseClass {
  public requiredKeys: string[] = ['a', 'b']
}

default class MyOtherClass extends MyClass {
  public requiredKeys: string[] = ['c'] // 'a', 'b' are not set anymore
}

// With requireKey:
@requireKey('c')
export default class MyOtherClass2 extends MyClass {
  // requiredKeys are 'a', 'b', 'c'
}
```

### All the possibilities

```ts
interface IParseCloudClass {

  beforeFind(
    req: Parse.Cloud.BeforeFindRequest,
  ): Parse.Query;

  processBeforeSave (
    req: Parse.Cloud.BeforeSaveRequest | IProcessRequest,
  ): Promise<Parse.Object>;

  beforeSave(
    req: Parse.Cloud.BeforeSaveRequest | IProcessRequest,
    // parse sdk > 2.0 does not have the res parameter
    res?: Parse.Cloud.BeforeSaveResponse | IProcessResponse,
  ): Promise<boolean>;

  afterSave (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise<Parse.Object>;

  processBeforeDelete (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise<Parse.Object>;

  beforeDelete(
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
    // parse sdk > 2.0 does not have the res parameter
    res?: Parse.Cloud.BeforeDeleteResponse | IProcessResponse,
  ): Promise<boolean>;

  afterDelete (
    req: Parse.Cloud.BeforeDeleteRequest | IProcessRequest,
  ): Promise<Parse.Object>;

}
```

Note: IProcessRequest is an interface that allows you to do testing

```ts
interface IProcessRequest {
  object: Parse.Object;
  user?: Parse.User;
  master?: boolean;
}
```


## Using addons

To use an addon, you would first import it, and then configure your class
to use that addon. Example:

```js
// with typescript or ES6
import { ParseCloudClass } from 'parse-server-addon-cloud-class';
import { SomeAddon } from 'some-addon-module';

const myConfig = new ParseCloudClass();

// use the addon
myConfig.useAddon(SomeAddon);

// you can use any number of addons
myConfig.useAddon(SomeOtherAddon);

// Configure your class to use the configuration
ParseCloudClass.configureClass(Parse, 'MyClass', myConfig);
```

Take into account that addons are executed in the order in which they were added.

## Creating addons

Addons can be created by extending ParseCloudClass and defining new behaviours on:
* `beforeFind` 
* `beforeSave`
* `beforeDelete`
* `afterSave`
* `afterDelete`
* `processBeforeSave`
* `processBeforeDelete`

### Example addon:

```js
// In Javascript
class Addon1 extends ParseCloudClass {
  async processBeforeSave(req) {
    req.object.set('addon1', true);
    return req.object;
  }
}
```

```ts
// In Typescript
class Addon1 extends ParseCloudClass {
  async processBeforeSave(req: Parse.Cloud.BeforeSaveRequest) {
    req.object.set('addon1', true);
    return req.object;
  }
}
```

Now you can also create addons using the new configuration objects, for example:

```js
const dbAddon = {
  afterSave: async function(req) {
    // replicate data to the other db
    return req.object;
  },
  afterDelete: async function(req) {
    // replicate data to the other db
    return req.object;
  }
}

const addonInstance = ParseCloudClass.fromObject(dbAddon);
```


## Addons

* Algolia Search: https://github.com/owsas/parse-server-addon-cloud-algolia 


## Credits

Developed by Juan Camilo Guarín Peñaranda,  
Otherwise SAS, Colombia  
2017

## License 

MIT.

## Support us on Patreon
[![patreon](./repo/patreon.png)](https://patreon.com/owsas)
