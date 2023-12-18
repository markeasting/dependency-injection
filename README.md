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

import { Container, Injectable } from "@wildsea/dependency-injection";

/* Create the container */
const container = new Container();

/* Injectable with zero dependencies  */
class Foo implements Injectable { 
    config: any;
    
    log(value: any) {
        console.log(value);
    }
}

/* MyClass depends on `Foo` and some config object */
class MyClass implements Injectable {
    constructor(
        public foo: Foo, 
        public config: any
    ) {
        this.foo.log(config);
    }
}

/* Next, we will 'wire' the services. */

container.register(Foo);
container.register(MyClass, [Foo, { myvar: 69 }]); 

/* Get the `MyClass` instance */
const myInstance = container.get(MyClass); 

console.log(myInstance);
```

## Development / build
`npm run build` (simply executes `tsc`).
