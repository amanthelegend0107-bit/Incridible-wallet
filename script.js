const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);

let wallet;
let lastBalance = 0;
let ethPrice = 0;

// LOCK
window.onload = () => {
  document.getElementById("lockScreen").style.display = "flex";
};

const APP_PASSWORD = "1234";

function unlock() {
  const input = document.getElementById("pass").value;

  if (input === APP_PASSWORD) {
    document.getElementById("lockScreen").style.display = "none";
  } else {
    alert("Wrong password");
  }
}

// PRICE
async function getPrice() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const data = await res.json();
  ethPrice = data.ethereum.usd;
}

// CREATE
async function createWallet() {
  wallet = ethers.Wallet.createRandom();

  document.getElementById("address").innerText = wallet.address;
  document.getElementById("receiveAddress").innerText = wallet.address;

  const encrypted = await wallet.encrypt("1234");
  localStorage.setItem("wallet", encrypted);

  alert("Save your seed phrase safely!");
}

// LOAD
async function loadWallet() {
  const encrypted = localStorage.getItem("wallet");

  if (!encrypted) {
    alert("No wallet found");
    return;
  }

  wallet = await ethers.Wallet.fromEncryptedJson(encrypted, "1234");

  document.getElementById("address").innerText = wallet.address;
  document.getElementById("receiveAddress").innerText = wallet.address;

  await getPrice();
  getBalance();
  trackWallet();
  showHistory();
}

// BALANCE
async function getBalance() {
  const balance = await provider.getBalance(wallet.address);
  const eth = parseFloat(ethers.utils.formatEther(balance));

  const usd = eth * ethPrice;

  document.getElementById("balance").innerText = eth.toFixed(4) + " ETH";
  document.getElementById("total").innerText = "$" + usd.toFixed(2);

  lastBalance = eth;
}

// SEND
async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  try {
    const usd = (amount * ethPrice).toFixed(2);

    const tx = await wallet.connect(provider).sendTransaction({
      to,
      value: ethers.utils.parseEther(amount)
    });

    await tx.wait();

    showNotification("📤 Sent $" + usd, "#ef4444");
    addTx("send", usd);

    getBalance();

  } catch {
    showNotification("❌ Error", "#ef4444");
  }
}

// TRACK
function trackWallet() {
  setInterval(async () => {
    const balance = await provider.getBalance(wallet.address);
    const current = parseFloat(ethers.utils.formatEther(balance));

    if (lastBalance !== 0) {
      if (current > lastBalance) {
        const diff = (current - lastBalance) * ethPrice;
        showNotification("💰 Received $" + diff.toFixed(2));
        addTx("receive", diff.toFixed(2));
      }
    }

    lastBalance = current;

  }, 5000);
}

// NOTIFICATION
function showNotification(text, color="#22c55e") {
  const box = document.getElementById("notify");

  box.innerText = text;
  box.style.background = color;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 3000);
}

// HISTORY
function addTx(type, amount) {
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
