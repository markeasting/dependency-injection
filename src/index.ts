import { ExtendableContainer } from './ExtendableContainer';

export * from './Container';
export * from './ExtendableContainer';
export * from './types';
export * from './assert';
export * from './errors';

/**
 * A globally available container instance. 
 * 
 * Must be used sparingly as a 'service locator'. Useful in you need your 
 * base app / kernel / controller class constructor to be void of dependencies. 
 * 
 * Also useful in the `configure()` method of extension bundles.
 */
export const container = new ExtendableContainer();
