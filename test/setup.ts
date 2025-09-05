// Configuration globale pour les tests Jest

// Augmenter les timeouts pour les tests qui nécessitent des opérations réseau
jest.setTimeout(30000);

// Mock console.log pour les tests si nécessaire
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Fonction pour restaurer les console originaux
const restoreConsole = () => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
};

// Fonction pour mocker les console
const mockConsole = () => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
};

// Exposer globalement
(global as any).restoreConsole = restoreConsole;
(global as any).mockConsole = mockConsole;

// Nettoyer après chaque test
afterEach(() => {
  restoreConsole();
  jest.clearAllMocks();
});

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
