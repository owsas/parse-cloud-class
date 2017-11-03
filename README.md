# Parse Cloud Class

A new way to define Parse.Cloud events for your classes (DB tables). With this module you can easily:

* Define minimum values for keys on your classes
* Define default values
* Define required keys
* Use addons to easily extend the funcionality of your app
* Create new addons and share them with the community
* Customize the default behaviour to your own needs

This module is meant to be used with [Parse](http://docs.parseplatform.org/) and [Parse Server](https://github.com/parse-community/parse-server)

## Installation
`> npm install parse-server-addon-cloud-class`

__Typescript__: This module comes bundled with Intellisense :)

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
  // new items will not be created if they have no 'name' set
  requiredKeys: ['name']
  defaultValues: {
    // all new items will have active: true
    active: true,
    // by default, timesShared will be 0
    timesShared: 0,
  },
  minimumValues: {
    // timesShared cannot go below 0
    timesShared: 0,
  }
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
    // Trigger the addons to determine if the object can be saved
    for (const addon of this.addons) {
      req.object = await addon.processBeforeSave(req);          
    }

    // write your own code here
    ....

    // make sure to return req.object
    return req.object;
  }
}
```

You can change the implementation of any method to your needs, but please, trigger the addon functions if you expect to have addon functionalities.

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


## Credits

Developed by Juan Camilo Guarín Peñaranda,  
Otherwise SAS, Colombia  
2017

## License 

MIT.