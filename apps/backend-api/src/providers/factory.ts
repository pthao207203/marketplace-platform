const MockProvider = require('./mock');
const TrackingMoreProvider = require('./trackingmore');

export function createProvider(name = 'mock') {
  try {
    const mod = require(`./${name}`);
    // Support: default export, named export (MockProvider), or the module itself (constructor or instance)
    const ProviderCandidate = mod && (mod.default || mod.MockProvider || mod);

    if (!ProviderCandidate) {
      throw new Error(`provider module ./${name} has no usable export`);
    }

    // If it's a constructor/function => instantiate
    if (typeof ProviderCandidate === 'function') {
      return new ProviderCandidate();
    }

    // If it's already an object (instance) => return as-is
    if (typeof ProviderCandidate === 'object') {
      return ProviderCandidate;
    }

    throw new Error(`unsupported provider export type for ./${name}`);
  } catch (err) {
    console.error('createProvider err', err);
    return null;
  }
}

module.exports = { createProvider };
