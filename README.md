# Minimal dependency injection container

Very minimal Dependency Injection container. 

In the past, static classes / globals / singletons caused lots of 'spaghetti' (e.g. hidden or cyclical dependencies).
The main point of this container is to expose the dependencies of (sub)systems more explicitely. 

## Installation
`npm install ... `

## Usage
- Services must implement the `Injectable` interface. 
- All services are 'shared' by default: you will always receive the same instance.

```ts
import { Container, Injectable, InjectableType } from "@wildsea/dependency-injection";

/* Create the container */
const container = new Container();

/* Shared service with zero dependencies  */
class Foo implements Injectable { 
    __inject: InjectableType.SHARED;
    
    getValue() {
        return 42;
    }
}

/* Create a non-shared service, must be constructed each time */
class Bar implements Injectable { 
    __inject: InjectableType.NEW_INSTANCE;

    prop = 69;
}

/* MyClass depends on `Foo` and some config object */
class MyClass implements Injectable {
    __inject: InjectableType.SHARED;
    constructor(
        public foo: Foo, 
        public bar: Bar, 
        public config: any
    ) {
        console.log(this.foo.getValue());
        console.log(this.bar.prop);
    }
}

/* Next, we will 'wire' the services. */

container.register(Foo);
container.register(MyClass, [
    Foo,            // Inject Foo as shared service
    new Bar,        // Inject new Bar as non-shared service
    { myvar: 69 }   // Inject miscellaneous props
]); 

/* Get the `MyClass` instance */
const myInstance = container.get(MyClass); 

console.log(myInstance);
```

## Development / build / test
`bun test --watch` - runs unit tests 

### Building
This package is a Typescript-only bundle that you can import into your projects. Therefore, you should build it along with your project. 

If you still desire to create a build, you can run the following commands: 

`npm run build` - simply runs the Typescript compiler, `tsc`.

`npm run watch` - runs `tsc` in watch mode

