import * as bip39 from 'bip39';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';

export const generateMnemonic = () => {
    return bip39.generateMnemonic();
};

export const mnemonicToWallet = (mnemonic: string, accountIndex: number = 0) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const derivedSeed = derivePath(path, seed.toString('hex')).key;
    return Keypair.fromSeed(derivedSeed);
};

export const validateMnemonic = (mnemonic: string) => {
    return bip39.validateMnemonic(mnemonic);
};
