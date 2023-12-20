
import { Container } from './Container';

import type { ClassType, BundleInterface, BundleConfigType } from './types';

/**
 * DI container that supports the {@link BundleInterface}.
 * 
 * - Register extension bundles via {@link addExtension()}
 * - Set bundle configuration via {@link configure()}
 */
export class ExtendableContainer extends Container {

    private extensions      = new Map<ClassType<any>, BundleInterface<any>>();
    private configs         = new Map<ClassType<any>, any>();
    private _extTypeMap     = new Map<string, ClassType<BundleInterface<any>>>();

    /** 
     * Apply an extension configuration. 
     * See {@link addExtension()} and {@link BundleInterface}. 
     */
    public configure<T extends BundleInterface<any>>(
        bundle: ClassType<T>, 
        config: BundleConfigType<T>
    ) {
        this.configs.set(bundle, config);
    }

    /** 
     * Add an extension bundle to the container. 
     * Bundles can be configured via {@link configure()} 
     */
    public addExtension<T extends BundleInterface<any>>(bundleCtor: ClassType<T>) {
        this.extensions.set(bundleCtor, new bundleCtor());
        this._extTypeMap.set(bundleCtor.name, bundleCtor);
    }
    
    /** 
     * Get an extension bundle from the container. 
     */
    public getExtension<T extends BundleInterface<any>>(bundle: ClassType<T> | string) {
        const ctor = this._extTypeMap.get(
            typeof bundle === 'string' ? bundle : bundle.name
        );

        return ctor ? this.get(ctor) as T : undefined;
    }

    /** 
     * Resolves the container. 
     * 
     * - Configures bundles, see {@link addExtension()} and {@link configure()}
     * - Applies implementation overrides, see {@link override()} 
     */
    public build() {
        super.build();

        for (const [key, Bundle] of this.extensions) {
            const config = this.configs.get(key);
            Bundle.configure(config);
        }
    }
}
