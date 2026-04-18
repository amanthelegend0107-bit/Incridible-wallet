// ===== IMPORT LIBRARIES =====
// (CDN must be added in index.html later)

let seedPhrase;

// CREATE MASTER SEED
async function createSeed() {
  seedPhrase = bip39.generateMnemonic();
  localStorage.setItem("seed", seedPhrase);

  console.log("Seed:", seedPhrase);

  generateAllAddresses(seedPhrase);
}

// LOAD SEED
function loadSeed() {
  seedPhrase = localStorage.getItem("seed");

  if (!seedPhrase) {
    alert("No seed found");
    return;
  }

  generateAllAddresses(seedPhrase);
}

// GENERATE ALL ADDRESSES
function generateAllAddresses(mnemonic) {

  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const root = bitcoin.bip32.fromSeed(seed);

  // ===== BTC =====
  const btcChild = root.derivePath("m/44'/0'/0'/0/0");
  const btc = bitcoin.payments.p2pkh({
    pubkey: btcChild.publicKey
  }).address;

  // ===== LTC =====
  const ltcChild = root.derivePath("m/44'/2'/0'/0/0");
  const ltc = bitcoin.payments.p2pkh({
    pubkey: ltcChild.publicKey
  }).address;

  // ===== ETH =====
  const ethWallet = ethers.Wallet.fromMnemonic(mnemonic);
  const eth = ethWallet.address;

  // ===== SOL =====
  const solKey = solanaWeb3.Keypair.fromSeed(seed.slice(0, 32));
  const sol = solKey.publicKey.toString();

  const walletData = { btc, ltc, eth, sol };

  localStorage.setItem("walletData", JSON.stringify(walletData));

  console.log(walletData);
}
