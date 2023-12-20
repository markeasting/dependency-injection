# Minimal dependency injection container

Very minimal Dependency Injection container with type-hinting. 

Other DI solutions use decorators or reflect-metadata, which I didn't like. 
So I built my own container, which mainly uses Typescript types for a neat development experience. 

<!-- # Installation -->
<!-- `npm install <package_name>` -->

## Development / building
This package is a Typescript-only bundle that you can import into your projects. Therefore, you can build it along with your project. 

If you desire to create a JS build, you can run the following commands: 

`npm run build` - simply runs the Typescript compiler, `tsc`.

`npm run watch` - runs `tsc` in watch mode

## Unit testing
`bun test --watch`

# Usage

### Create the container

```ts
import { Container } from "@wildsea/dependency-injection";

/* Create the container */
const container = new Container();
```

### Create and register an injectable service
- Services must implement the `Injectable` interface. 
- All services are 'shared' by default: you will always receive the same instance.

```ts
import type { Injectable, InjectableType } from "@wildsea/dependency-injection";

/* Shared service with zero dependencies  */
class Foo implements Injectable { 
    __inject: InjectableType.SHARED;
    
    getValue() {
        return 42;
    }
}

container.register(Foo);
```

### Define a service with dependencies
```ts
import { Foo } from '.'

class MyClass implements Injectable {
    
    __inject: InjectableType.SHARED;

    /* MyClass depends on `Foo` + some config object */
    constructor(
        public foo: Foo, 
        public config: any
    ) {
    }

    method() {
        console.log(this.foo.getValue());
    }
}

/* Register the service and define how it's dependencies are wired */
container.register(MyClass, [
    Foo,            // Inject Foo as shared service
    { myvar: 69 }   // Inject some miscellaneous config object
]); 
```

### Get an instance

```ts
container.build(); // Wire the services

const instance = container.get(MyClass); 

console.log(instance.method()); // Returns '42' from the 'Foo' dependency
```

---

# Container extensions
You can add your own extension bundles to the container. Loosely based on 
how the Symfony framework handles bundles.

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

    configure(config: Partial<MyBundleConfig>): void {

        this.config = {...this.config, ...config}; // Apply configuration overrides

        /* Wire the dependencies for this module */
        container.register(Timer, []);
        container.register(GraphicsManager, [DomContent, this.config.graphics]);

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

container.addExtension(MyBundle);

container.build(); // Wire the services / resolve the bundles
```

### Get the extension 
```ts
const ext = container.getExtension(MyBundle); 

if (ext) {
    const bundleTimer = ext.timer;          /* instanceof 'Timer' */
    const bundleGraphics = ext.graphics;    /* instanceof 'GraphicsManager' */
}
```

### Tip: assist tree-shaking
```ts
import type { MyBundle } from "." // Note the 'import type'

/** 
 * MyBundle isn't imported in this file, just the type.
 * This will aid tree shaking, especially if you need to load bundles conditionally
 */
const ext = container.getExtension<MyBundle>('MyBundle'); 

// if (ext) ...
```

