import { ExtendableContainer } from './ExtendableContainer';

export * from './Container';
export * from './ExtendableContainer';
export * from './types';
export * from './assert';
export * from './errors';

/**
 * Globally available container instance.
 * 
 * Could be useful as a 'service locator' - should be used sparingly. 
 * 
 * Can be useful for configuring extension bundles. 
 * see {@link BundleInterface.configure}. 
 * 
 * @category Container
 */
export const container = new ExtendableContainer();
