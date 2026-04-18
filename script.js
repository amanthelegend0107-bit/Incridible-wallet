const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);

let wallet;
let walletData;
let lastBalance = 0;
let ethPrice = 0;

// ===== PRICE =====
async function getPrice() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const data = await res.json();
  ethPrice = data.ethereum.usd;
}

// ===== CREATE WALLET (MULTI-CHAIN) =====
async function createWallet() {
  const ethWallet = ethers.Wallet.createRandom();

  const mnemonic = ethWallet.mnemonic.phrase;

  // ETH
  const ethAddress = ethWallet.address;

  // BTC (fake simple conversion for now)
  const btcAddress = "btc_" + ethAddress.slice(2, 10);

  // LTC (fake simple conversion for now)
  const ltcAddress = "ltc_" + ethAddress.slice(2, 10);

  // SOL (fake simple conversion for now)
  const solAddress = "sol_" + ethAddress.slice(2, 10);

  walletData = {
    mnemonic,
    eth: ethAddress,
    btc: btcAddress,
    ltc: ltcAddress,
    sol: solAddress
  };

  document.getElementById("address").innerText =
    "ETH: " + ethAddress;

  document.getElementById("receiveAddress").innerText =
    "ETH: " + ethAddress +
    "\nBTC: " + btcAddress +
    "\nLTC: " + ltcAddress +
    "\nSOL: " + solAddress;

  const encrypted = await ethWallet.encrypt("1234");
  localStorage.setItem("wallet", encrypted);
  localStorage.setItem("walletData", JSON.stringify(walletData));
}

// ===== LOAD WALLET =====
async function loadWallet() {
  const encrypted = localStorage.getItem("wallet");
  walletData = JSON.parse(localStorage.getItem("walletData"));

  if (!encrypted) {
    alert("No wallet found");
    return;
  }

  wallet = await ethers.Wallet.fromEncryptedJson(
    encrypted,
    "1234"
  );

  document.getElementById("address").innerText =
    "ETH: " + walletData.eth;

  document.getElementById("receiveAddress").innerText =
    "ETH: " + walletData.eth +
    "\nBTC: " + walletData.btc +
    "\nLTC: " + walletData.ltc +
    "\nSOL: " + walletData.sol;

  await getPrice();
  getBalance();
  trackWallet();
}

// ===== ETH BALANCE =====
async function getBalance() {
  const balance = await provider.getBalance(walletData.eth);
  const eth = parseFloat(ethers.utils.formatEther(balance));

  const usd = eth * ethPrice;

  document.getElementById("balance").innerText =
    eth.toFixed(4) + " ETH";

  document.getElementById("total").innerText =
    "$" + usd.toFixed(2);

  lastBalance = eth;
}

// ===== SEND ETH =====
async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  try {
    setStatus("📤 Sending $" + (amount * ethPrice).toFixed(2), "yellow");

    const tx = await wallet.connect(provider).sendTransaction({
      to,
      value: ethers.utils.parseEther(amount)
    });

    await tx.wait();

    setStatus("✅ Sent $" + (amount * ethPrice).toFixed(2), "lime");

    getBalance();

  } catch {
    setStatus("❌ Error", "red");
  }
}

// ===== STATUS =====
function setStatus(msg, color="white") {
  const s = document.getElementById("status");
  s.innerText = msg;
  s.style.color = color;
}

// ===== TRACK ETH =====
function trackWallet() {
  setInterval(async () => {
    const balance = await provider.getBalance(walletData.eth);
    const current = parseFloat(ethers.utils.formatEther(balance));

    if (lastBalance !== 0) {

      if (current > lastBalance) {
        const diff = (current - lastBalance) * ethPrice;
        setStatus("💰 Receiving $" + diff.toFixed(2), "lime");
      }

      if (current < lastBalance) {
        const diff = (lastBalance - current) * ethPrice;
        setStatus("📤 Sent $" + diff.toFixed(2), "red");
      }
    }

    lastBalance = current;

  }, 5000);
}
function showMultiWallet() {
  const data = JSON.parse(localStorage.getItem("multiWallet"));

  if (!data) return;

  document.getElementById("address").innerText =
    "ETH: " + data.eth;

  document.getElementById("receiveAddress").innerText =
    "ETH: " + data.eth +
    "\nBTC: " + data.btc +
    "\nLTC: " + data.ltc +
    "\nSOL: " + data.sol;
}
function showNotification(text, color="#22c55e") {
  const box = document.getElementById("notify");

  box.innerText = text;
  box.style.background = color;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, function addTx(type, amount) {
  let history = JSON.parse(localStorage.getItem("txHistory")) || [];

  const tx = {
    type,
    amount,
    time: new Date().toLocaleString()
  };

  history.unshift(tx);

  localStorage.setItem("txHistory", JSON.stringify(history));

  showHistory();
}

function showHistory() {
  const history = JSON.parse(localStorage.getItem("txHistory")) || [];
  const box = document.getElementById("history");

  box.innerHTML = "";

  history.slice(0, 10).forEach(tx => {
    const div = document.createElement("div");

    div.innerText =
      (tx.type === "receive" ? "💰 Received $" : "📤 Sent $") +
      tx.amount + " • " + tx.time;

    div.style.margin = "5px";

    box.appendChild(div);
  });
}
