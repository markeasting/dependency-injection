import { BundleConfigType, BundleInterface, ClassType, Dependencies, Injectable, InjectableType } from ".";

/**
 * Very minimal Dependency Injection container. 
 * 
 * In the past, static classes / globals / singletons caused lots of 'spaghetti' (e.g. hidden or cyclical dependencies).
 * The main point of this container is to expose the dependencies of (sub)systems more explicitely. 
 * 
 * https://www.baeldung.com/cs/dependency-injection-vs-service-locator
 */
export class Container implements Injectable {

    __inject: InjectableType.SHARED;

    private overides        = new Map<ClassType<any>, ClassType<any>>();
    private dependencies    = new Map<ClassType<any>, ClassType<any>[]>();
    private services        = new Map<ClassType<any>, any>();
    private configs         = new Map<ClassType<BundleInterface<any>>, any>();

    private compiled = false;

    constructor() {
        this.services.set(Container, this);
    }

    /** Register a class as a shared service */
    public register<T extends ClassType<Injectable>>(
        ctor: T, 
        dependencies: Dependencies<T>
    ) {

        const deps = dependencies as any[];

        if (deps.includes(ctor)) {
            throw new Error(`Cyclical dependency for ${ctor.name}`);
        }

        this.services.set(ctor, null);
        this.dependencies.set(ctor, deps);
    }

    /** Apply bundle configuration */
    public configure<T extends BundleInterface<any>>(
        bundle: ClassType<T>, 
        config: BundleConfigType<T>
    ) {
        this.configs.set(bundle, config);
    }

    /** Configure bundles and apply implementation overrides if they were set via {@link override()} */
    public build(bundles: Record<string, ClassType<BundleInterface<any>>> = {}) {
        this.compiled = true;

        this.overides.forEach((impl, key) => {
            this.services.set(key, this.createInstance(impl));
        });

        for (const key in bundles) {
            const Bundle = bundles[key];
            const bundleinstance = new Bundle();
            const config = this.configs.get(Bundle);

            bundleinstance.configure(config);
        }
    }

    /** 
     * Override a service with another concrete implementation. 
     * You may omit 'dependencies' to use the same dependencies as the overridden class. 
     */
    public override<T extends ClassType<Injectable>>(
        ctor: T,
        overrideCtor: T, 
        dependencies?: Dependencies<T>
    ) {
        if (this.compiled) {
            throw new CompilerOverrideUserError;
        }
        this.services.set(ctor, null);
        this.overides.set(ctor, overrideCtor);

        if (dependencies?.length) {
            this.dependencies.set(overrideCtor, dependencies as any[]);
        } else {
            const existingDeps = this.dependencies.get(ctor);

            if (existingDeps) 
                this.dependencies.set(overrideCtor, existingDeps);
        }
    }

    /** 
     * Get a shared service from the container - dependencies will be resolved 
     * @TODO currently, this also returns transients services if requested. Will be fixed at some point. 
     */
    public get<T extends object>(ctor: ClassType<T>): T {
        return this.resolve(ctor as ClassType<Injectable>, true) as T;
    }

    /** Resolve an instance of the given class */
    public resolve<T extends Injectable>(ctor: ClassType<T>, strict = true): T|undefined {
        if (!this.compiled) {
            throw new ContainerNotResolvedError();
        }
        if (this.services.has(ctor)) {
            let instance = this.services.get(ctor);
            if (!instance) {
                instance = this.createInstance(ctor);
                this.services.set(ctor, instance);
            }
            return instance;
        }
        if (strict)
            throw new ServiceNotFoundError(ctor);
    }

    /** Create an instance with injected dependencies */
    private createInstance<T extends Injectable>(ctor: ClassType<T>): T {

        /* Resolve dependencies */
        const depsCtors = this.dependencies.get(ctor) || [];
        const depsInstances = depsCtors.map(d => d?.name ? this.resolve(d) : d);
        
        return new ctor(...depsInstances);
    }
}

// export class MissingBundleConfigurationError extends Error {
//     constructor(ctor: ClassType<any>) {
//         super(`'${ctor.name}' is registered as a bundle, but no static 'configure' method was found.`);
//     }
// };

export class ContainerNotResolvedError extends Error {
    constructor() {
        super('Container is has overrides. Try using container.build() first.');
    }
}

export class CompilerOverrideUserError extends Error {
    constructor() {
        super('Container was already compiled. You can only call override() before build().');
    }
}

export class ServiceNotFoundError extends Error {
    constructor(ctor: ClassType<any>) {
        super(`'${ctor.name}' is not a registered service. Did you forget to call 'container.register(${ctor.name})'? Or did you forget to load a bundle?`);
    }
};
