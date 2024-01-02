import { expect, test } from "bun:test";
import { ContainerOverrideUserError, Container, ContainerNotResolvedError, CyclicalDependencyError, ServiceNotFoundError, assert } from "../src";

const TEST_VALUE1 = 69;
const TEST_VALUE2 = 42;
const TEST_VALUE3 = 32;

class MyService {
    id: number;
    getValue1() { return TEST_VALUE1 }
}

class MyTransientService {
    id: number;
    getValue2() { return TEST_VALUE2 }
}

class MyClassConfig {
    somevar: boolean = true;
}

class MyClass {
    constructor(
        public dep: MyService,
        public transient: MyTransientService,
        public config: MyClassConfig
    ) {
        // assert(dep, nonSharedDep);
    }
    testDep1() { return this.dep.getValue1() }
    testDep2() { return this.transient.getValue2() }
}

test('Container:construct() / self-register', () => {
    const container = new Container();
    container.build();

    expect(container.get(Container)).toStrictEqual(container);
});

test('Container:setParameter()', () => {
    const container = new Container();
    container.setParameter('myvar', TEST_VALUE1);
    container.setParameter('someother', true);

    expect(container.getParameter<number>('myvar')).toStrictEqual(TEST_VALUE1);
    expect(container.getParameter<boolean>('someother')).toStrictEqual(true);
});

test('Container:register()', () => {
    const container = new Container();

    container.register(MyService, []);
    container.build();

    expect(container.get(MyService)).toStrictEqual(new MyService);
});

test('Container:register() - throw if cyclical dependency was found', () => {
    const container = new Container();

    class BadService {
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

    instance1.id = 1;
    instance2.id = 2; 
    
    expect(instance1).toStrictEqual(instance2);
    
    // instance1 == instance2, so instance1.id will also be '2'
    expect(instance1.id).toStrictEqual(instance2.id);
});

test('Container:get() - type:transient', () => {
    const container = new Container();

    container.transient(MyTransientService, []);
    container.build();

    const instance1 = container.get(MyTransientService);
    const instance2 = container.get(MyTransientService);

    expect(instance1).toBeInstanceOf(MyTransientService);
    expect(instance2).toBeInstanceOf(MyTransientService);

    instance1.id = 1;
    instance2.id = 2;
    
    // instance1 !== instance2, so the id's will be different. 
    expect(instance1).not.toStrictEqual(instance2);
});

test('Container:get() - transients with shared deps', () => {

    class RandomGenerator  {
        counter: number = 0;

        getValue() { 
            this.counter++;
            return performance.now() * Math.random()
        }
    }

    class TransientService  {
        val: number;
        
        constructor(
            public dep: RandomGenerator
        ) {
            this.val = dep.getValue();
        }
    }

    const container = new Container();
    container.singleton(RandomGenerator, []);
    container.transient(TransientService, [RandomGenerator]);
    container.build();

    const instance1 = container.get(TransientService);
    const instance2 = container.get(TransientService);

    /* The random values generated in the transients should be unique */
    expect(instance1.val).not.toStrictEqual(instance2.val);

    /* dep is a singleton, they should be the same for each transient */
    expect(instance1.dep).toStrictEqual(instance1.dep);

    /* Test if the side effects in getValue() persist in 'dep' */
    expect(instance1.dep.counter).toStrictEqual(2);
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
    container.register(MyClass, [MyService, MyTransientService, new MyClassConfig()]);
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

test('Container:get() - inject complex deps', () => {
    const container = new Container();

    const config = new MyClassConfig();

    container.singleton(MyService, []);
    container.transient(MyTransientService, []);
    container.singleton(MyClass, [MyService, MyTransientService, config]);
    container.build();

    const instance = container.get(MyClass);
    
    expect(instance).toBeInstanceOf(MyClass);
    expect(instance.transient).toBeInstanceOf(MyTransientService);
    expect(instance.config).toStrictEqual(config);
    expect(instance.testDep1()).toStrictEqual(TEST_VALUE1);
    expect(instance.testDep2()).toStrictEqual(TEST_VALUE2);
});

test('Container:get() - inject primitives', () => {
    const container = new Container();

    class Foo {
        constructor(
            public obj: { myvar: boolean }, 
            public bool: boolean, 
            public num: number
        ) {}
    }

    container.singleton(Foo, [{ myvar: false }, true, TEST_VALUE1]);
    container.build();

    const instance = container.get(Foo);
    
    expect(instance).toBeInstanceOf(Foo);
    expect(instance.obj.myvar).toStrictEqual(false);
    expect(instance.bool).toStrictEqual(true);
    expect(instance.num).toStrictEqual(TEST_VALUE1);
});


test('Container:get() - override', () => {
    const container = new Container();

    const config = new MyClassConfig();

    class OverrideClass extends MyClass {
        extraMethod() { return TEST_VALUE3; }
    }

    class MyTransientOverride extends MyTransientService {}

    container.singleton(MyService, []);
    container.transient(MyTransientOverride, []);
    container.singleton(MyClass, [MyService, MyTransientOverride, config]);

    // container.override(MyClass, OverrideClass); // Optionally, you may ommit deps
    container.override(MyClass, OverrideClass, [MyService, MyTransientOverride, config]); 

    container.build();

    const instance = container.get(MyClass);
    
    expect(instance).toBeInstanceOf(OverrideClass);
    expect(instance.dep).toBeInstanceOf(MyService);
    expect(instance.transient).toBeInstanceOf(MyTransientOverride);
    expect(instance.config).toStrictEqual(config);
    expect(instance.testDep1()).toStrictEqual(TEST_VALUE1);
    expect(instance.testDep2()).toStrictEqual(TEST_VALUE2);
});

test('Container:get() - throw if build was called before override', () => {
    const container = new Container();

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
