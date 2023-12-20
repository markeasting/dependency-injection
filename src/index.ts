import { ExtendableContainer } from './ExtendableContainer';

export * from './Container';
export * from './ExtendableContainer';
export * from './types';
export * from './assert';
export * from './errors';

export const container = new ExtendableContainer();
