let wallet;
let btcData;
let ethPrice = 0;
let btcPrice = 0;

// LOCK
window.onload = () => {
  document.getElementById("lockScreen").style.display = "flex";
};

// PASSWORD
async function hash(pass) {
  const enc = new TextEncoder().encode(pass);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function unlock() {
  const input = document.getElementById("pass").value;
  const saved = localStorage.getItem("pass");

  if (!saved) {
    localStorage.setItem("pass", await hash(input));
    document.getElementById("lockScreen").style.display = "none";
    return;
  }

  if (await hash(input) === saved) {
    document.getElementById("lockScreen").style.display = "none";
  } else {
    alert("Wrong password");
  }
}

// CREATE
async function createWallet() {
  wallet = ethers.Wallet.createRandom();
  const mnemonic = wallet.mnemonic.phrase;

  const encrypted = await wallet.encrypt(
    document.getElementById("pass").value
  );

  localStorage.setItem("wallet", encrypted);
  localStorage.setItem("seed", mnemonic);

  // BTC
  const key = bitcoin.ECPair.makeRandom();
  btcData = {
    address: bitcoin.payments.p2pkh({ pubkey: key.publicKey }).address,
    wif: key.toWIF()
  };

  localStorage.setItem("btc", JSON.stringify(btcData));

  alert("SAVE SEED:\n" + mnemonic);
}

// LOAD
async function loadWallet() {
  const enc = localStorage.getItem("wallet");

  wallet = await ethers.Wallet.fromEncryptedJson(
    enc,
    document.getElementById("pass").value
  );

  btcData = JSON.parse(localStorage.getItem("btc"));

  document.getElementById("address").innerText = wallet.address;

  getPrices();
  updateAll();
}

// PRICES
async function getPrices() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd"
  );
  const d = await res.json();

  ethPrice = d.ethereum.usd;
  btcPrice = d.bitcoin.usd;
}

// BALANCES
async function updateAll() {
  // ETH
  const bal = await new ethers.providers.JsonRpcProvider(
    "https://rpc.ankr.com/eth"
  ).getBalance(wallet.address);

  const eth = parseFloat(ethers.utils.formatEther(bal));
  document.getElementById("balance").innerText = eth + " ETH";

  // BTC
  const res = await fetch(
    "https://api.blockcypher.com/v1/btc/main/addrs/" +
      btcData.address +
      "/balance"
  );
  const data = await res.json();

  const btc = data.final_balance / 100000000;
  document.getElementById("btcBalance").innerText = btc + " BTC";

  // TOTAL
  const total = eth * ethPrice + btc * btcPrice;

  document.getElementById("total").innerText =
    "$" + total.toFixed(2);
}

// SEND ETH
async function sendETH() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const tx = await wallet
    .connect(new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth"))
    .sendTransaction({
      to,
      value: ethers.utils.parseEther(amount)
    });

  await tx.wait();

  notify("Sent ETH");
}

// BTC FEE
async function getBTCFee() {
  const r = await fetch("https://mempool.space/api/v1/fees/recommended");
  const d = await r.json();
  return d.fastestFee;
}

// SEND BTC
async function sendBTC() {
  const to = prompt("BTC address");
  const amount = parseFloat(prompt("Amount BTC"));

  const feeRate = await getBTCFee();
  const fee = feeRate * 250;

  const res = await fetch(
    "https://api.blockcypher.com/v1/btc/main/addrs/" +
      btcData.address +
      "?unspentOnly=true&includeScript=true"
  );

  const utxo = await res.json();

  const psbt = new bitcoin.Psbt();
  const key = bitcoin.ECPair.fromWIF(btcData.wif);

  let total = 0;

  for (let tx of utxo.txrefs) {
    psbt.addInput({
      hash: tx.tx_hash,
      index: tx.tx_output_n,
      witnessUtxo: {
        script: Buffer.from(tx.script, "hex"),
        value: tx.value
      }
    });

    total += tx.value;
  }

  const send = Math.floor(amount * 100000000);

  psbt.addOutput({ address: to, value: send });
  psbt.addOutput({
    address: btcData.address,
    value: total - send - fee
  });

  utxo.txrefs.forEach((_, i) => psbt.signInput(i, key));

  psbt.finalizeAllInputs();

  const hex = psbt.extractTransaction().toHex();

  await fetch("https://api.blockcypher.com/v1/btc/main/txs/push", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ tx: hex })
  });

  notify("Sent BTC");
}

// SEED
function showSeed() {
  alert(localStorage.getItem("seed"));
}

async function restoreWallet() {
  const seed = document.getElementById("seedInput").value;

  wallet = ethers.Wallet.fromMnemonic(seed);

  const encrypted = await wallet.encrypt(
    document.getElementById("pass").value
  );

  localStorage.setItem("wallet", encrypted);
  localStorage.setItem("seed", seed);

  alert("Restored");
}

// NOTIFY
function notify(msg) {
  const n = document.getElementById("notify");
  n.innerText = msg;
  n.style.display = "block";

  setTimeout(() => (n.style.display = "none"), 2000);
}
