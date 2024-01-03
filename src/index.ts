import { ExtendableContainer } from './ExtendableContainer';

export * from './Container';
export * from './ExtendableContainer';
export * from './types';
export * from './assert';
export * from './errors';

/**
 * Globally available container instance, can be used as a 'service locator'.
 * 
 * Should be used sparingly. Useful in you need your 
 * base app / kernel / controller constructor to have zero dependencies. 
 * 
 * Also useful in the `configure()` method of {@link BundleInterface}.
 * 
 * @category Container
 */
export const container = new ExtendableContainer();
