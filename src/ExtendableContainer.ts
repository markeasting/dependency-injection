
import { Container } from './Container';

import type { ClassType, BundleInterface, BundleConfigType } from './types';

/**
 * DI container that supports the {@link BundleInterface}.
 * 
 * - Register extension bundles via {@link addExtension()}
 * - Set bundle configuration via {@link configure()}
 */
export class ExtendableContainer extends Container {

    protected extensions      = new Map<ClassType<any>, BundleInterface<any>>();
    protected extensionConfig = new Map<ClassType<any>, any>();
    
    #extTypeMap = new Map<string, ClassType<BundleInterface<any>>>();

    /** 
     * Configures a bundle with the given parameters. 
     * 
     * See also: {@link addExtension()}. 
     */
    public configure<T extends BundleInterface<any>>(
        bundleCtor: ClassType<T>, 
        config: BundleConfigType<T>
    ) {
        this.extensionConfig.set(bundleCtor, config);
    }

    /** 
     * Add an extension bundle to the container. 
     * 
     * Bundles can be configured via {@link configure()}. 
     * 
     * See also: {@link BundleInterface}.
     */
    public addExtension<T extends BundleInterface<any>>(
        bundleCtor: ClassType<T>
    ) {
        this.extensions.set(bundleCtor, new bundleCtor());
        this.#extTypeMap.set(bundleCtor.name, bundleCtor);
    }
    
    /** 
     * Retrieves an extension bundle from the container. 
     */
    public getExtension<T extends BundleInterface<any>>(
        bundle: ClassType<T> | string
    ) {
        const ctor = this.#extTypeMap.get(
            typeof bundle === 'string' ? bundle : bundle.name
        );

        return ctor ? this.get(ctor) as T : undefined;
    }

    /** 
     * Resolves the container. 
     * 
     * - Configures extension bundles (see {@link addExtension()}) 
     *   and their configuration (see {@link configure()}).
     * - Applies implementation overrides, see {@link override()}.
     */
    public build() {
        super.build();

        for (const [key, Bundle] of this.extensions) {
            const config = this.extensionConfig.get(key);
            Bundle.configure(config);
        }
    }
}
