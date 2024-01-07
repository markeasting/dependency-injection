import { expect, test } from "bun:test";
import { BundleInterface, ExtendableContainer, ParameterNotFoundError } from "../src";

const TEST_VALUE_BOOL = true;
const TEST_VALUE1 = 69;
const TEST_VALUE2 = 42;
const TEST_VALUE3 = 32;

class Foo {
    constructor(public someNumber: number) {}
}

class Bar {
    constructor(public foo: Foo) {}
}

class MyBundleConfig {
    debug = TEST_VALUE_BOOL;
    someoverride = -1; // Will be overridden by a test case
}

test('setParameter()', () => {
    const container = new ExtendableContainer();
    container.setParameter('myvar', TEST_VALUE1);
    container.setParameter('someother', true);

    expect(container.getParameter<number>('myvar')).toStrictEqual(TEST_VALUE1);
    expect(container.getParameter<boolean>('someother')).toStrictEqual(true);
});

test('getParameter() - throw if parameter was not found', () => {
    const container = new ExtendableContainer();
    // container.setParameter('myvar', TEST_VALUE1); // Noramlly required
    
    expect(() => { 
        container.getParameter('myvar'); 
    }).toThrow(
        new ParameterNotFoundError('myvar')
    );

    // Don't throw if strict mode is off
    expect(() => { 
        container.getParameter('myvar', false); 
    }).not.toThrow();
});

test('addExtension() / getExtension', () => {
    
    const container = new ExtendableContainer();

    class MyBundle implements BundleInterface<MyBundleConfig> {

        constructor(public foo: Foo) {}
    
        configure(): void {
    
            container.transient(Foo, [TEST_VALUE1]);
            container.singleton(Bar, [Foo]);
    
            container.register(MyBundle, [Foo]);
        }
    }

    container.setParameter('superglobal', TEST_VALUE1)
        .addExtension(MyBundle)
        .build();

    /* Test cases */

    const bundle = container.getExtension(MyBundle);

    expect(bundle?.foo).toBeInstanceOf(Foo);
    expect(bundle?.foo.someNumber).toStrictEqual(TEST_VALUE1);
});

test('configuration / overrides', () => {
    
    const container = new ExtendableContainer();

    class MyBundle implements BundleInterface<MyBundleConfig> {

        constructor(public foo: Foo) {}
    
        configure(overrides: Partial<MyBundleConfig>): void {

            const config = {...new MyBundleConfig(), ...overrides};

            container.register(Foo, [config.someoverride]);
            container.register(MyBundle, [Foo]);
        }
    }

    container.addExtension(MyBundle, {
        someoverride: TEST_VALUE3
    });

    container.build();

    /* Test cases */

    const bundle = container.getExtension(MyBundle);

    expect(bundle?.foo.someNumber).toStrictEqual(TEST_VALUE3);
});


test('setParameter / getParameter', () => {
    
    const container = new ExtendableContainer();

    class MyBundle implements BundleInterface<MyBundleConfig> {

        constructor(public foo: Foo) {}
    
        configure(): void {
    
            container.transient(Foo, [
                container.getParameter<number>('superglobal')
            ]);
    
            container.register(MyBundle, [Foo]);
        }
    }

    container.setParameter('superglobal', TEST_VALUE2)
        .addExtension(MyBundle)
        .build();

    /* Test cases */

    const bundle = container.getExtension(MyBundle);

    expect(bundle?.foo).toBeInstanceOf(Foo);
    expect(bundle?.foo.someNumber).toStrictEqual(TEST_VALUE2);
});

test('getExtension() with string / optional deps', () => {
    
    const container = new ExtendableContainer();

    class MyBundle implements BundleInterface<MyBundleConfig> {

        constructor(public foo: Foo, public bar: Bar) {}
    
        configure(): void {
    
            container.singleton(Foo, [1234]);
            container.singleton(Bar, [Foo]);
    
            container.register(MyBundle, [Foo, Bar]);
        }
    }

    container.addExtension(MyBundle)
        .build();

    /* Test cases */

    const bundle = container.getExtension<MyBundle>('MyBundle');

    expect(bundle?.foo).toBeInstanceOf(Foo);
    expect(bundle?.bar).toBeInstanceOf(Bar);
    expect(bundle?.bar.foo).toBeInstanceOf(Foo);
    expect(bundle?.bar.foo).toStrictEqual(bundle!.foo);
});

