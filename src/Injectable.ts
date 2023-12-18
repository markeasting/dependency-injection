/**
 * The DI {@link Container} will resolve anything with this interface.
 * 
 * This interface enables the usage of {@link ClassType} in the `register()` and `get()` methods. 
 */
export interface Injectable<ModuleConfigType extends Object | undefined = any> {
    config: ModuleConfigType;
}

export class ModuleConfig {
    // #isConfig = true;
}
