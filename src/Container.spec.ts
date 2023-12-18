import { expect, test } from "bun:test";
import { Container, Injectable, InjectableType, ServiceNotFoundError, assert } from ".";

const TEST_VALUE1 = 69;
const TEST_VALUE2 = 42;
const TEST_VALUE3 = 32;

class MyService implements Injectable {
    __inject: InjectableType.SHARED;
    getValue1() { return TEST_VALUE1 }
}

class MyNonSharedService implements Injectable {
    __inject: InjectableType.TRANSIENT;
    getValue2() { return TEST_VALUE2 }
}

class MyClassConfig {
    somevar: boolean = true;
}

class MyClass implements Injectable {
    __inject: InjectableType.SHARED;
    constructor(
        public dep: MyService,
        public nonSharedDep: MyNonSharedService,
        public config: MyClassConfig
    ) {
        // assert(dep, nonSharedDep);
    }
    testDep1() { return this.dep.getValue1() }
    testDep2() { return this.nonSharedDep.getValue2() }
}

test('Container:construct()', () => {
    const container = new Container();
    container.build();

    expect(container.get(Container)).toBe(container);
});

test('Container:register()', () => {
    const container = new Container();

    container.register(MyService);
    container.build();

    expect(container.get(MyService)).toEqual(new MyService);
});

test('Container:get() - zero dependencies', () => {
    const container = new Container();

    container.register(MyClass);
    container.build();

    const instance = container.get(MyClass);

    expect(instance).toBeInstanceOf(MyClass);
});

test('Container:get() - non-shared instance', () => {
    const container = new Container();

    container.register(MyNonSharedService);
    container.build();

    const instance = container.get(MyNonSharedService);

    expect(instance).toBeInstanceOf(MyNonSharedService);
});

test('Container:get() - throw if service is not registered', () => {
    const container = new Container();

    const config = new MyClassConfig();

    // container.register(MyModule); // This would normally be required
    container.register(MyClass, [MyService, new MyNonSharedService, config]);
    container.build();

    // Check if container throws: MyModule wasn't registered
    expect(() => { container.get(MyService) }).toThrow(
        new ServiceNotFoundError(MyService)
    );
    
    // Check if container throws: Cannot find `MyModule` when resolving MyClass
    expect(() => { container.get(MyClass) }).toThrow(
        new ServiceNotFoundError(MyService)
    );
});

test('Container:get() - inject deps', () => {
    const container = new Container();

    const config = new MyClassConfig();

    container.register(MyService);
    container.register(MyClass, [MyService, new MyNonSharedService, config]);
    container.build();

    const instance = container.get(MyClass);
    
    expect(instance).not.toBeUndefined();
    expect(instance.dep).not.toBeUndefined();
    expect(instance.nonSharedDep).not.toBeUndefined();
    expect(instance.config).toStrictEqual(config);
    expect(instance.testDep1()).toEqual(TEST_VALUE1);
    expect(instance.testDep2()).toEqual(TEST_VALUE2);
});


test('Container:get() - override', () => {
    const container = new Container();

    const config = new MyClassConfig();

    class OverrideClass extends MyClass {
        extraMethod() { return TEST_VALUE3; }
    }

    container.register(MyService);
    container.register(MyClass, [MyService, new MyNonSharedService, config]);

    // container.override(MyClass, OverrideClass, [MyService, new MyNonSharedService, config]);
    container.override(MyClass, OverrideClass);
    container.build();

    const instance = container.get(MyClass);
    
    expect(instance).toBeInstanceOf(OverrideClass);
    expect(instance).not.toBeUndefined();
    expect(instance.dep).not.toBeUndefined();
    expect(instance.nonSharedDep).not.toBeUndefined();
    expect(instance.config).toStrictEqual(config);
    expect(instance.testDep1()).toEqual(TEST_VALUE1);
    expect(instance.testDep2()).toEqual(TEST_VALUE2);
});
