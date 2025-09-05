// Test simple pour vérifier la configuration de base

describe('Basic Configuration Test', () => {
  it('should run tests', () => {
    expect(true).toBe(true);
  });

  it('should have correct Node.js version', () => {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    expect(majorVersion).toBeGreaterThanOrEqual(18);
  });

  it('should have test environment set', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
