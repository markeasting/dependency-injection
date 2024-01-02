import { expect, test } from "bun:test";
import { ContainerOverrideUserError, Container, ContainerNotResolvedError, CyclicalDependencyError, Injectable, InjectableType, ServiceNotFoundError, assert } from "../src";

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

    container.register(MyService, []);
    container.build();

    expect(container.get(MyService)).toEqual(new MyService);
});

test('Container:register() - throw if cyclical dependency was found', () => {
    const container = new Container();

    class BadService implements Injectable {
        __inject: InjectableType.SHARED;
        constructor(private selfReference: BadService) {}
    }

    expect(() => { 
        container.register(BadService, [BadService]); 
    }).toThrow(
        new CyclicalDependencyError(BadService)
    );
});

test('Container:get() - zero dependencies', () => {
    const container = new Container();

    container.register(MyService, []);
    container.build();

    const instance = container.get(MyService);

    expect(instance).toBeInstanceOf(MyService);
});

test('Container:get() - type:shared', () => {
    const container = new Container();

    container.register(MyService, []);
    container.build();

    const instance1 = container.get(MyService);
    const instance2 = container.get(MyService);

    expect(instance1).toStrictEqual(instance2);
});

test('Container:get() - type:transient', () => {
    const container = new Container();

    container.register(MyNonSharedService, []);
    container.build();

    const instance = container.get(MyNonSharedService);

    expect(instance).toBeInstanceOf(MyNonSharedService);
});

test('Container:get() - transients with shared deps', () => {

    class MainClass implements Injectable {
        __inject: InjectableType.SHARED;
    }

    class RandomGenerator implements Injectable {
        __inject: InjectableType.SHARED;
        getValue() { 
            return performance.now() * Math.random()
        }
    }

    class TransientService implements Injectable {
        __inject: InjectableType.TRANSIENT;
        val: number;
        constructor(
            public rand: RandomGenerator
        ) {
            this.val = rand.getValue();
        }
    }

    const container = new Container();
    container.register(RandomGenerator, [], InjectableType.SHARED);
    container.register(TransientService, [RandomGenerator], InjectableType.TRANSIENT);
    container.build();

    const instance1 = container.get(TransientService);
    const instance2 = container.get(TransientService);

    expect(instance1.rand).toStrictEqual(instance1.rand);
    expect(instance1.val).not.toEqual(instance2.val);
})


test('Container:get() - throw if build was called before get', () => {
    const container = new Container();

    container.register(MyService, []);
    // container.build(); // Normally required here

    // Check if container throws: cannot get() before/without build()
    expect(() => { 
        container.get(MyService);
    }).toThrow(
        new ContainerNotResolvedError()
    );
});

test('Container:get() - throw if service is not registered', () => {
    const container = new Container();

    // container.register(MyNonSharedService, []); // This would normally be required
    container.register(MyClass, [MyService, MyNonSharedService, new MyClassConfig()]);
    container.build();

    // Check if container throws: MyModule wasn't registered
    expect(() => { 
        container.get(MyService) 
    }).toThrow(
        new ServiceNotFoundError(MyService)
    );
    
    // Check if container throws: Cannot find `MyModule` when resolving MyClass
    expect(() => { 
        container.get(MyClass) 
    }).toThrow(
        new ServiceNotFoundError(MyService)
    );
});

test('Container:get() - inject deps', () => {
    const container = new Container();

    const config = new MyClassConfig();

    container.register(MyService, []);
    container.register(MyNonSharedService, []);
    container.register(MyClass, [MyService, MyNonSharedService, config]);
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

    container.register(MyService, []);
    container.register(MyClass, [MyService, new MyNonSharedService, config]);

    container.override(MyClass, OverrideClass); // Optionally, you can also override deps
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

test('Container:get() - throw if build was called before override', () => {
    const container = new Container();

    const config = new MyClassConfig();

    class OverrideClass extends MyClass {
        extraMethod() { return TEST_VALUE3; }
    }

    // Check if container throws: cannot override if build() was called
    expect(() => { 
        container.register(MyService, []);
        container.build();

        container.override(MyClass, OverrideClass);
    }).toThrow(
        new ContainerOverrideUserError()
    );
});

/** 
 * @TODO add tests for bundles and bundle configuration
 */
