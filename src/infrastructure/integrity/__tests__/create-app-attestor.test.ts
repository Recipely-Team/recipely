import { isAndroid, isIos } from '@infrastructure/constants/platform';
import { createAppAttestor } from '@infrastructure/integrity/create-app-attestor';
import { AppAttestAttestor } from '@infrastructure/integrity/app-attest-attestor';
import { PlayIntegrityAttestor } from '@infrastructure/integrity/play-integrity-attestor';
import type { AttestationRepository } from '@infrastructure/integrity/attestation-repository';
import type { SecureKeyValueStoreInterface } from '@domain/storage/secure-key-value-store-interface';

jest.mock('@infrastructure/constants/platform', () => ({ isIos: jest.fn(), isAndroid: jest.fn() }));
jest.mock('@expo/app-integrity', () => ({}));

const store = {} as SecureKeyValueStoreInterface;
const repo = {} as AttestationRepository;
const projectNumber = process.env.EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER;

describe('createAppAttestor', () => {
  afterEach(() => {
    if (projectNumber === undefined) delete process.env.EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER;
    else process.env.EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER = projectNumber;
  });

  it('uses App Attest on iOS', () => {
    jest.mocked(isIos).mockReturnValue(true);
    expect(createAppAttestor(store, repo)).toBeInstanceOf(AppAttestAttestor);
  });

  it('uses Play Integrity on Android when the build carries its Cloud project number', () => {
    jest.mocked(isIos).mockReturnValue(false);
    jest.mocked(isAndroid).mockReturnValue(true);
    process.env.EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER = '123';
    expect(createAppAttestor(store, repo)).toBeInstanceOf(PlayIntegrityAttestor);
  });

  it('has none on Android without a project number, or on the web', () => {
    jest.mocked(isIos).mockReturnValue(false);
    jest.mocked(isAndroid).mockReturnValue(true);
    delete process.env.EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER;
    expect(createAppAttestor(store, repo)).toBeNull();
    jest.mocked(isAndroid).mockReturnValue(false);
    process.env.EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER = '123';
    expect(createAppAttestor(store, repo)).toBeNull();
  });
});
