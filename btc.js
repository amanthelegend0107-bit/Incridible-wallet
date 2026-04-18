// ===== BTC SYSTEM =====

let btcBalance = 0;
let btcPrice = 0;

// GET BTC PRICE
async function getBTCPrice() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
  );
  const data = await res.json();
  btcPrice = data.bitcoin.usd;
}

// GET BTC BALANCE
async function getBTCBalance(address) {
  try {
    const res = await fetch(
      "https://api.blockcypher.com/v1/btc/main/addrs/" + address + "/balance"
    );

    const data = await res.json();

    btcBalance = data.final_balance / 100000000;

    console.log("BTC:", btcBalance);

  } catch (e) {
    console.log("BTC error");
  }
}

// AUTO LOAD BTC
async function loadBTC() {
  if (!wallet) return;

  await getBTCPrice();
  await getBTCBalance(wallet.address);

  updatePortfolio();
}

// UPDATE TOTAL WITH BTC
function updatePortfolio() {
  const ethText = document.getElementById("balance").innerText;
  const eth = parseFloat(ethText);

  const ethUSD = eth * ethPrice;
  const btcUSD = btcBalance * btcPrice;

  const total = ethUSD + btcUSD;

  document.getElementById("total").innerText =
    "$" + total.toFixed(2);
}

// AUTO RUN EVERY 10s
setInterval(loadBTC, 10000);
