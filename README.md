# Minimal dependency injection container

Very minimal Dependency Injection container in Typescript. 

Other DI solutions use decorators (which are experimental) or reflect-metadata (extra package). This package heavily relies on Typescript and native Javascript features instead. 

## Features
- No additional npm package requirements
- Services are wired manually
    - Typescript has your back when you configure your application
- Extension bundle system: easily create 'feature toggles' in your application

## Installation
This package is not available on NPM just yet. For now, you can clone this repository and [link the local package](https://docs.npmjs.com/cli/v10/commands/npm-linkk) in your own project. 

`npm link @wildsea/dependency-injection`

## Development / building
`npm run build` - run the Typescript compiler (`tsc`).

`npm run watch` - runs `tsc` in watch mode.

### Unit testing
`bun test --watch`

# Usage

### Create the container

```ts
import { Container } from "@wildsea/dependency-injection";

const container = new Container();
```

Or import a globally available container instance directly:

```ts
import { container } from "@wildsea/dependency-injection";
```

### Create and register an injectable service
- Services must implement the `Injectable` interface. 
- All services are 'shared' by default: you will always receive the same instance when it is injected or queried by the container.

```ts
import type { Injectable, InjectableType } from "@wildsea/dependency-injection";

/* Shared service with zero dependencies  */
class Foo implements Injectable { 
    __inject: InjectableType.SHARED;
    
    getValue() {
        return 42;
    }
}

/* Register the service. [] means that it has 0 dependencies. */
container.register(Foo, []);
```

### Define a service with dependencies
In this example, `MyClass` is a service that depends upon an instance of `Foo` (registered in the previous section). 
```ts
import { Foo } from '.'

class MyClass implements Injectable {
    
    __inject: InjectableType.SHARED;

    /* MyClass depends on `Foo` */
    constructor(
        public foo: Foo
    ) {}

    myMethod() {
        console.log(this.foo.getValue()); // Will log '42'
    }
}

/* Register the service and pass Foo as injectable. */
container.register(MyClass, [Foo]); 
```

### Get an instance from the container

```ts
/* You must call `build` first. This will wire the services. */
container.build(); 

/* Once you get an instance, dependencies will be injected 'lazily'. */
const instance = container.get(MyClass); 

console.log(instance.method()); // Returns '42' from the 'Foo' dependency (see above)
```

### Type hinting for wiring / injecting services
Typescript will yell at you when you pass the wrong dependencies. The container creatively uses Typescript's [ConstructorParameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#constructorparameterstype) utility type to resolve this. 
```ts
container.register(MyClass, [Foo]); // Everything is OK. 

container.register(MyClass, [Baz, 123]); // Error! MyClass requires Foo.
```

### Passing non-injectables (e.g. plain objects)
You may also pass things like objects or other primitives (which aren't shared services). These must be constructed when registering the class. 
```ts
/* Note that this object does not implement `Injectable`. */
class SomeConfig {
    myvar = true
}

class SomeClass implements Injectable {
    
    __inject: InjectableType.SHARED;

    /* SomeClass depends on a plain config object */
    constructor(
        public config: SomeConfig
    ) {}
}

/* Register the service and pass the config object as a new instance. */
container.register(SomeClass, [new SomeConfig()]); 
```

# Container extensions
You can add your own extension bundles to the container. You may use this system to add 'feature toggles' in your application. This is loosely based on the way Symfony handles bundles.

### Create your extension bundle

```ts
import type { BundleInterface } from '@wildsea/dependency-injection'

/* Define the bundle configuration class */
export class MyBundleConfig {
    debug: boolean;
    graphics: Partial<GraphicsConfig>;
}

/* Create the bundle definition */
export class MyBundle implements BundleInterface<MyBundleConfig> {

    __inject: InjectableType.SHARED;

    config = new MyBundleConfig();

    constructor(
        public timer: Timer,
        public graphics: GraphicsManager,
    ) {}

    /* The configure() method wires the services in this bundle */
    configure(config: Partial<MyBundleConfig>): void {

        /* Apply configuration overrides */
        this.config = {...this.config, ...config}; 

        /* Register the services in this bundle */
        container.register(Timer, []);
        container.register(GraphicsManager, [Timer, this.config.graphics]);

        /* Then register the bundle itself */
        container.register(MyBundle, [Timer, GraphicsManager]);
    }
}
```

### Register and load the extension

```ts
import { ExtendableContainer } from "@wildsea/dependency-injection";
import { MyBundle } from "."

/* Create the container */
const container = new ExtendableContainer();

/* Register the extension */
container.addExtension(MyBundle);
```

### Get the extension 
```ts
import { MyBundle } from "."

/* You must call `build` first. This will wire the services. */
container.build(); 

const ext = container.getExtension(MyBundle); 

if (ext) {
    const bundleTimer = ext.timer;          /* instanceof 'Timer' */
    const bundleGraphics = ext.graphics;    /* instanceof 'GraphicsManager' */
}
```

#### Tip: assist tree-shaking
In the example above, `MyBundle` is always imported. So even if the extension is never required in your code, it is still included in your build, inflating code size. 

To assist dead code removal / tree-shaking, you may use `import type` and pass the (stringified) name of the class to `getExtension()`. The type argument will ensure correct type hinting. 

This way, you can cleanly selectively include or exclude (optional) bundles in your codebase. 

```ts
/* Note the 'import type' here. These will be stripped from your build. */
import type { MyBundle } from "." 

const ext = container.getExtension<MyBundle>('MyBundle');

// if (ext) { ... }
```

