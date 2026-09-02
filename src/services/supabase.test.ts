import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(() => ({ auth: {} })) }));

vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: {} }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

describe('configuration Supabase', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalAnonKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  });

  it('refuse une configuration absente en production', async () => {
    vi.stubGlobal('__DEV__', false);

    await expect(import('./supabase')).rejects.toThrow('Configuration de production absente');
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('autorise le client factice uniquement en développement', async () => {
    vi.stubGlobal('__DEV__', true);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(import('./supabase')).resolves.toBeDefined();
    expect(mocks.createClient).toHaveBeenCalledWith(
      'https://placeholder.supabase.co',
      'placeholder-anon-key',
      expect.any(Object),
    );
  });
});
