import { ClassType } from ".";

export class CyclicalDependencyError extends Error {
    constructor(ctor: ClassType<any>) {
        super(`Cyclical dependency for ${ctor.name}`);
    }
}

export class ContainerNotResolvedError extends Error {
    constructor() {
        super('Container must be resolved first. Try using container.build() first.');
    }
}

export class ContainerOverrideUserError extends Error {
    constructor() {
        super('Container was already compiled. You can only call override() before build().');
    }
}

export class ServiceNotFoundError extends Error {
    constructor(ctor: ClassType<any>) {
        super(`'${ctor.name}' is not a registered service. Did you forget to call 'container.register(${ctor.name})'? Or did you forget to load a bundle?`);
    }
};
