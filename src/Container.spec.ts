import { expect, test } from "bun:test";
import { Container, Injectable, ServiceNotFoundError } from ".";

const TEST_VALUE = 69;

class MyModule implements Injectable {
    config: any;
    getValue() { return TEST_VALUE }
}

class MyClass implements Injectable {
    config: any;
    constructor(private dep: MyModule) {}
    testDep() { return this.dep.getValue() }
}

test('Container:construct()', () => {
    const container = new Container();
    expect(container.get(Container)).toBe(container);
});

test('Container:register()', () => {
    const container = new Container();

    container.register(MyModule);

    expect(container.get(MyModule)).toEqual(new MyModule);
});

test('Get a simple instance from the container', () => {
    const container = new Container();

    container.register(MyClass);

    const instance = container.get(MyClass);

    expect(instance).toBeInstanceOf(MyClass);
});

test('Throw if class is not registered', () => {
    const container = new Container();

    // container.register(MyModule); // This would normally be required
    container.register(MyClass, [MyModule]);

    // Check if container throws: MyModule wasn't registered
    expect(() => { container.get(MyModule) }).toThrow(new ServiceNotFoundError(MyModule));
    
    // Check if container throws: Cannot find `MyModule` when resolving MyClass
    expect(() => { container.get(MyClass) }).toThrow(new ServiceNotFoundError(MyModule)); 
});

test('Inject dependencies', () => {
    const container = new Container();

    container.register(MyModule);
    container.register(MyClass, [MyModule]);

    const instance = container.get(MyClass);
    
    expect(instance).not.toBeUndefined();
    expect(instance.testDep()).toEqual(TEST_VALUE);
});

