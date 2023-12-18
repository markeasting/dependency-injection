/**
 * The DI {@link Container} will resolve anything with this interface.
 * 
 * This interface enables the usage of {@link ClassType} in the `register()` and `get()` methods. 
 */
export interface Injectable {
    __inject: InjectableType;
}

/**
 * - SHARED - the same instance will be returned for each injection
 * - NEW_INSTANCE - a new instance of the class must be constructed each time
 */
export enum InjectableType {
    SHARED,
    NEW_INSTANCE
}

export class ModuleConfig {
    // #isConfig = true;
}
