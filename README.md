# Minimal dependency injection container
Minimal Dependency Injection container, written in Typescript. 

## Features
- No additional npm package requirements.
- No autowiring, you need to [build and configure](#registering-services) your own application. 
- [Typescript has your back](#type-hinting-for-wiring) when you wire dependencies.
- Supports basic [overriding / mocking](#overriding--mocking-services) of services.
- Optional [extension bundle system](#container-extension-bundles): easily create 'feature toggles' for your application.

## Why?
To prevent spaghetti code (i.e. enforce [SOLID](https://en.m.wikipedia.org/wiki/SOLID) / reduce [tight coupling](https://en.m.wikipedia.org/wiki/Coupling_(computer_programming))), without inflating the codebase too much. 

You can achieve the most basic form of DI by constructing objects outside of 
classes and just passing them wherever they are required. Alternative Javascript 
DI solutions tend to use decorators (which are experimental) or `reflect-metadata` 
(extra package), which [I didn't like](https://en.m.wikipedia.org/wiki/Preference). 

This module simply relies on Typescript and native Javascript features instead. 
It gives full control to build your own application container and wire as you 
wish. When keep your services and bundles [small and managable](https://en.m.wikipedia.org/wiki/Single_responsibility_principle), 
your code / coupling will be much easier to maintain. 

For a concrete usecase, see the [basic example app](https://github.com/markeasting/dependency-injection/blob/master/test/example.spec.ts). 

## Installation
This package is not available on NPM (just yet). 
For now, you can clone this repository and [link the local package](https://docs.npmjs.com/cli/v10/commands/npm-linkk) 
in your own project. 

`npm link @wildsea/dependency-injection`

## Development / building
`npm run build` - run the Typescript compiler (`tsc`).

`npm run watch` - runs `tsc` in watch mode.

### Unit testing
`npm test` - uses [Bun](https://bun.sh/docs/cli/test) as test runner.

# Usage guide

## Create a container

```ts
import { Container } from "@wildsea/dependency-injection";

const container = new Container();
```

Or import a globally available container instance directly:

```ts
import { container } from "@wildsea/dependency-injection";
```

## Registering services
Simply register your class as a service by calling `register()`. 

Services are 'shared' by default - you will always receive the same instance 
when it is injected or queried by the container. See below for more lifetime 
options.

```ts
/* Service with zero dependencies  */
class Foo { 
    getValue() {
        return 42;
    }
}

/* Register the service. [] means that it has 0 dependencies. */
container.register(Foo, []);
```

#### Shared and transient services
You can pass the object lifetime to the `register()` method as the third 
argument. By default, it will register a *shared* service.

Some shortcuts for setting the lifetime are `singleton()` and `transient()`: 

```ts
container.singleton(...);   // Shared service: each instance is the same.
container.transient(...);   // Transient service: each instance is unique. 
```

#### Defining service dependencies
In this example, `MyClass` is a service that depends upon an instance of `Foo`:

```ts
import { Foo } from './Foo';

class MyClass {

    /* MyClass depends on an instance of `Foo` */
    constructor(public foo: Foo) {}

    myMethod() {
        console.log(this.foo.getValue()); // Will log '42'
    }
}

/** 
 * Register the services. 
 * 1) Register 'Foo'
 * 2) Wire `Foo` to be injected into MyClass
 */
container.register(Foo, []); 
container.register(MyClass, [Foo]); 
```

#### Type hinting for wiring
Typescript will yell at you when you pass the wrong dependencies. The container 
creatively uses Typescript's [ConstructorParameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#constructorparameterstype) utility type to provide type 
hinting. 

```ts
container.register(MyClass, [Foo]); // Everything is OK. 

container.register(MyClass, [Baz, 123]); // Error! MyClass requires Foo.
```

#### Passing primitives (non-injectables)
You may also pass things like objects or primitives (which aren't or cannot be 
registered services). These must be constructed when registering the class: 

```ts
class SomeConfig {
    myvar = true
}

class SomeClass {

    /* SomeClass depends on primitives */
    constructor(
        public config: SomeConfig,
        public mynumber: number
    ) {}
}

/* Register the service and pass the dependencies as values. */
container.register(SomeClass, [new SomeConfig(), 1234]); 
```

## Getting service instances
You can request a service instance via `get()`. Only when this is called, the 
dependencies will be resolved and injected (lazy initialization).

Before using this, you must first compile the container by calling `build()`. 
This will initialize the container (i.e. apply service overrides and configure 
bundles):

```ts
container.build(); 
```
Then you can `get()` an instance by passing the name of a class:

```ts
const instance = container.get(MyClass); 

console.log(instance.foo.getValue()); // Returns '42' (see above)
```

## Overriding / mocking services
You can override the implementation of a service by using `override()`.

Javascript does not support interfaces (i.e. you cannot pass a TS 
interface by value). Therefore, you should first `register()` a 'base class' as 
a default implementation, after which you may override it using `override()`. 

```ts
/* Since you cannot pass TS interfaces in the JS world, IFoo must be a `class`. */
class IFoo {
    someMethod(): void {}
}

/* First register the default implementation / 'base class' for IFoo. */
container.transient(IFoo, []); 

container.singleton(MyService, [IFoo]); // MyService depends on IFoo

container.transient(ConcreteFoo, []);   // Register an override service
container.override(IFoo, ConcreteFoo);  // ConcreteFoo will be passed to MyService
```

## Container extension bundles
You can add your own extension bundles to the container. You may use this 
system to add 'feature toggles' in your application. This is loosely based on 
the way Symfony handles bundles.

### Define an extension bundle

```ts
import { container } from "@wildsea/dependency-injection";

import type { BundleInterface } from '@wildsea/dependency-injection'

/* Define the bundle configuration class */
export class MyBundleConfig {
    debug: boolean;
    myService: Partial<MyServiceConfig>;
}

/* Create the bundle definition */
export class MyBundle implements BundleInterface<MyBundleConfig> {

    constructor(
        public api: ApiManager,
        public service: MyService,
    ) {}

    /* The configure() method wires the services in this bundle */
    configure(overrides: Partial<MyBundleConfig>): void {

        /* Apply configuration overrides */
        const config = {...new MyBundleConfig(), ...overrides}; 

        /* Get some global parameters (could also be passed via config, based on the scope) */
        const apiKey = container.getParameter('apiKey');

        /* Wire the services in this bundle */
        container.transient(ApiManager, [apiKey]);
        container.singleton(MyService, [ApiManager, config.myService]);

        /* Then register the bundle itself */
        container.register(MyBundle, [Timer, MyService]);
    }
}
```

### Register an extension bundle
You may use the globally available `container` instance, 
since this has extensions enabled by default. 

```ts
import { container } from "@wildsea/dependency-injection";
```

Or create one explicitly: 

```ts
import { ExtendableContainer } from "@wildsea/dependency-injection";

const container = new ExtendableContainer();
```

Then load / enable your extension bundle. Optionally, you can pass configuration. 

```ts
container.addExtension(MyBundle, {
    // TS will type-hint this config as `MyBundleConfig`
    debug: true 
});
```

### Get an extension 
```ts
import { MyBundle } from "."

/* You must call `build` first. */
container.build(); 

const ext = container.getExtension(MyBundle); 

if (ext) {
    const instance1 = ext.api;      /* instanceof 'ApiManager' */
    const instance2 = ext.service;  /* instanceof 'MyService' */
}
```

#### Tip: assist tree-shaking
In the example above, `MyBundle` is always imported. So even if the extension 
is never required / used in your code, it's still imported, inflating code size. 

To assist dead code removal / tree-shaking, you may use `import type` and pass 
the (stringified) name of the class to `getExtension()`. The type argument will 
ensure correct type hinting. 

This way, you can cleanly selectively include or exclude (optional) bundles in 
your codebase. 

```ts
/* Note the 'import type' here. These will be stripped from your build. */
import type { MyBundle } from "." 

const ext = container.getExtension<MyBundle>('MyBundle');

// if (ext) { ... }
```
# Putting it all together
You can check out the basic application example [here](https://github.com/markeasting/dependency-injection/blob/master/test/example.spec.ts). 

```ts
const container = new ExtendableContainer();

/* Logger.ts */
import type { BundleInterface } from '../src';

enum LogLevel {
    WARNING = 'WARNING',
    DEBUG = 'DEBUG'
}

class LoggerService {

    constructor(
        public logLevel: LogLevel
    ) {}

    log(string: string) {
        console.log(`${this.logLevel} - ${string}`);
    }
}

/* Database.ts */
class Database {

    constructor(
        public logger: LoggerService
    ) {}

    connect() {
        this.logger.log('Success!');
    }
}

/* MyBundle.ts */
import { Container, ExtendableContainer } from "../src";

class MyBundleConfig {
    logLevel: LogLevel = LogLevel.WARNING;
}

class MyBundle implements BundleInterface<MyBundleConfig> {

    constructor(public database: Database) {}

    configure(overrides: Partial<MyBundleConfig>): void {

        const config = {...new MyBundleConfig(), ...overrides};

        container.transient(LoggerService, [config.logLevel]);
        container.singleton(Database, [LoggerService]);

        container.register(MyBundle, [Database]);
    }
}

/* BaseApp.ts */
class BaseApp {

    database?: Database;

    constructor(
        /**
         * Empty constructor - use the container as a service locator here.
         * 
         * This allows easier sub-classing / extending of the App class 
         * e.g. only a super() call, without dependencies.
         */
    ) {
        /** 
         * Example of a feature toggle: 
         * we can only use the Database feature from MyBundle if added it. 
         */
        const myBundle = container.getExtension<MyBundle>('MyBundle');

        if (myBundle) {
            this.database = myBundle.database; 
            // Or alternatively, `this.database = container1.get(Database)`

            this.database.connect();
        }
    }
}

```
