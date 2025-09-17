// Mock du module 'bindings' utilisé par src/index.ts
// Redirige vers notre faux addon natif pour les tests.
module.exports = function bindings(modName) {
    if (modName === 'soem_addon') {
        return require('./soem_addon.js');
    }
    // Permettre d'autres usages si besoin
    try {
        return require(modName);
    } catch (e) {
        throw new Error(`Mock bindings: module non supporté: ${modName}`);
    }
};
