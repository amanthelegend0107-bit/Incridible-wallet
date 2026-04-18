let btcBalance = 0;
let ltcBalance = 0;
let solBalance = 0;

let btcPrice = 0;
let ltcPrice = 0;
let solPrice = 0;

// ===== PRICES =====
async function getPrices() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,solana&vs_currencies=usd"
  );
  const data = await res.json();

  btcPrice = data.bitcoin.usd;
  ltcPrice = data.litecoin.usd;
  solPrice = data.solana.usd;
}

// ===== BTC =====
async function getBTC(address) {
  try {
    const res = await fetch(
      "https://api.blockcypher.com/v1/btc/main/addrs/" + address + "/balance"
    );
    const data = await res.json();

    btcBalance = data.final_balance / 100000000;
  } catch {}
}

// ===== LTC =====
async function getLTC(address) {
  try {
    const res = await fetch(
      "https://api.blockcypher.com/v1/ltc/main/addrs/" + address + "/balance"
    );
    const data = await res.json();

    ltcBalance = data.final_balance / 100000000;
  } catch {}
}

// ===== SOL =====
async function getSOL(address) {
  try {
    const res = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address]
      })
    });

    const data = await res.json();
    solBalance = data.result.value / 1000000000;

  } catch {}
}

// ===== LOAD ALL =====
async function loadAllBalances() {
  const data = JSON.parse(localStorage.getItem("multiWallet"));
  if (!data) return;

  await getPrices();

  await getBTC(data.btc);
  await getLTC(data.ltc);
  await getSOL(data.sol);

  updateTotal();
}

// ===== UPDATE TOTAL =====
function updateTotal() {
  const ethText = document.getElementById("balance").innerText;
  const eth = parseFloat(ethText);

  const ethUSD = eth * ethPrice;
  const btcUSD = btcBalance * btcPrice;
  const ltcUSD = ltcBalance * ltcPrice;
  const solUSD = solBalance * solPrice;

  const total = ethUSD + btcUSD + ltcUSD + solUSD;

  document.getElementById("total").innerText =
    "$" + total.toFixed(2);
}

// AUTO REFRESH
setInterval(loadAllBalances, 10000);
