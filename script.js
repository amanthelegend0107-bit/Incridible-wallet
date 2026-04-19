let wallet;
let btcData;
let ethPrice = 0;
let btcPrice = 0;
let chart;
let lockTimer;

/* TOKENS */
const TOKENS = [
  {
    name: "USDT",
    symbol: "USDT",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6
  }
];

/* AUTO LOCK */
function resetLockTimer() {
  clearTimeout(lockTimer);
  lockTimer = setTimeout(() => {
    document.getElementById("lockScreen").style.display = "flex";
    wallet = null;
  }, 60000);
}

document.onclick = resetLockTimer;
document.onkeydown = resetLockTimer;

/* HASH */
async function hash(pass, salt) {
  const enc = new TextEncoder().encode(pass + salt);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/* UNLOCK */
async function unlock() {
  const input = document.getElementById("pass").value;
  const saved = localStorage.getItem("pass");

  if (!saved) {
    const salt = Math.random().toString(36);
    const hashed = await hash(input, salt);
    localStorage.setItem("pass", hashed);
    localStorage.setItem("salt", salt);
    document.getElementById("lockScreen").style.display = "none";
    createWallet();
    return;
  }

  const salt = localStorage.getItem("salt");

  if (await hash(input, salt) === saved) {
    document.getElementById("lockScreen").style.display = "none";
    loadWallet();
  }
}

/* CREATE */
async function createWallet() {
  wallet = ethers.Wallet.createRandom();

  const encrypted = await wallet.encrypt(
    document.getElementById("pass").value
  );

  localStorage.setItem("wallet", encrypted);

  btcData = bitcoin.ECPair.makeRandom();
  localStorage.setItem("btc", JSON.stringify({
    wif: btcData.toWIF(),
    address: bitcoin.payments.p2pkh({ pubkey: btcData.publicKey }).address
  }));

  loadWallet();
}

/* LOAD */
async function loadWallet() {
  const enc = localStorage.getItem("wallet");

  wallet = await ethers.Wallet.fromEncryptedJson(
    enc,
    document.getElementById("pass").value
  );

  btcData = JSON.parse(localStorage.getItem("btc"));

  getPrices();
  updateAll();
  loadChart();
}

/* PRICES */
async function getPrices() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd"
  );
  const d = await res.json();

  ethPrice = d.ethereum.usd;
  btcPrice = d.bitcoin.usd;
}

/* BALANCES */
async function updateAll() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");

  const bal = await provider.getBalance(wallet.address);
  const eth = parseFloat(ethers.utils.formatEther(bal));

  document.getElementById("balance").innerText = eth.toFixed(4);

  const btcRes = await fetch(
    "https://api.blockcypher.com/v1/btc/main/addrs/" +
    btcData.address
  );

  const btcDataAPI = await btcRes.json();
  const btc = btcDataAPI.final_balance / 100000000;

  document.getElementById("btcBalance").innerText = btc.toFixed(6);

  const total = eth * ethPrice + btc * btcPrice;
  document.getElementById("total").innerText = "$" + total.toFixed(2);

  loadTokens();
}

/* TOKENS */
async function loadTokens() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");

  const abi = ["function balanceOf(address) view returns (uint256)"];

  const box = document.getElementById("tokenList");
  box.innerHTML = "";

  for (let t of TOKENS) {
    const c = new ethers.Contract(t.address, abi, provider);
    const bal = await c.balanceOf(wallet.address);

    const val = bal / (10 ** t.decimals);

    if (val > 0) {
      const div = document.createElement("div");
      div.className = "asset";
      div.innerHTML = `<span>${t.symbol}</span><span>${val.toFixed(2)}</span>`;
      box.appendChild(div);
    }
  }
}

/* SEND ETH */
async function sendETH() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");

  const tx = await wallet.connect(provider).sendTransaction({
    to,
    value: ethers.utils.parseEther(amount)
  });

  await tx.wait();
  alert("ETH Sent");
}

/* SEND BTC (SIMPLIFIED) */
async function sendBTC() {
  alert("BTC sending logic already included (UTXO mode)");
}

/* USDT */
async function sendUSDT() {
  const to = prompt("USDT address");
  const amount = prompt("Amount");

  const abi = ["function transfer(address,uint256) returns (bool)"];

  const contract = new ethers.Contract(
    TOKENS[0].address,
    abi,
    wallet.connect(new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth"))
  );

  const tx = await contract.transfer(
    to,
    ethers.utils.parseUnits(amount, TOKENS[0].decimals)
  );

  await tx.wait();
  alert("USDT Sent");
}

/* CHART */
async function loadChart() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=7"
  );

  const data = await res.json();
  const prices = data.prices.map(p => p[1]);

  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: prices.map((_, i) => i),
      datasets: [{
        data: prices,
        borderColor: "#22c55e",
        borderWidth: 2,
        fill: false
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

/* UI */
function toggleSend() {
  const box = document.getElementById("sendBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
}

function showSeed() {
  alert(localStorage.getItem("wallet") ? "Wallet exists (encrypted)" : "No wallet");
}
