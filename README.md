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

### Create and register a service
Services are 'shared' by default: you will always receive the same instance when it is injected or queried by the container.

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

### Object lifecycle: shared / singleton or transient
By default, `register()` will add a shared service - You may pass the lifetime as the third argument. 

Two shortcuts for this are `singleton()` and `transient()`: 

```ts
container.singleton(...);   // Singleton / shared service: each instance is the same.
container.transient(...);   // Transient service: each instance is unique. 
```

### Define a service with dependencies
In this example, `MyClass` is a service that depends upon an instance of `Foo` (registered in the previous section). 
```ts
import { Foo } from '.'

class MyClass {

    /* MyClass depends on `Foo` */
    constructor(
        public foo: Foo
    ) {}

    myMethod() {
        console.log(this.foo.getValue()); // Will log '42'
    }
}

/* Register the service and wire `Foo` to be injected. */
container.register(MyClass, [Foo]); 
```

### Get an instance from the container
Before getting instances, you must first call `build`. This will wire the services.

```ts
container.build(); 
```
You can request an instance via `get()`. Only when this is called, the dependencies will be resolved and injected (lazy initialization).

```ts
const instance = container.get(MyClass); 

console.log(instance.foo.getValue()); // Returns '42' from the 'Foo' dependency (see above)
```

### Type hinting for wiring / injecting services
Typescript will yell at you when you pass the wrong dependencies. The container creatively uses Typescript's [ConstructorParameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#constructorparameterstype) utility type to resolve this. 
```ts
container.register(MyClass, [Foo]); // Everything is OK. 

container.register(MyClass, [Baz, 123]); // Error! MyClass requires Foo.
```

### Passing non-injectables (e.g. primitives and plain objects)
You may also pass things like objects or primitives (which aren't or cannot be registered services). These must be constructed when registering the class: 
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
        container.transient(Timer, []);
        container.singleton(GraphicsManager, [Timer, this.config.graphics]);

        /* Then register the bundle itself */
        container.register(MyBundle, [Timer, GraphicsManager]);
    }
}
```

### Register and load the extension
You may use the globally available `container` instance, since this has extensions enabled by default. 
```ts
import { container } from "@wildsea/dependency-injection";
```

Or create one explicitly: 

```ts
import { ExtendableContainer } from "@wildsea/dependency-injection";

const container = new ExtendableContainer();
```

Register your extension with: 
```ts
container.addExtension(MyBundle);
```
Optionally, you may pass bundle configuration

```ts
container.addExtension(MyBundle, {
    debug: true // Type hinted by `MyBundleConfig`, see above
});
```

### Get an extension from the container 
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

