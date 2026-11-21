const APP_CONFIG = {
    name: "LuckyVault",
    tagline: "Your Luck, Your Fortune.",

    contractAddress: "0x4b9b359e7b99816c5334eec9a01bbc265324ea51",

    networkId: 11155111,

    abi: [
        "function owner() view returns (address)",
        "function ticketPrice() view returns (uint256)",
        "function getPlayerCount() view returns (uint256)",
        "function getMyTickets(address) view returns (uint256)",
        "function getPrizePool() view returns (uint256)",
        "function buyTickets(uint256) payable",
        "function drawWinner()",
        "function roundNumber() view returns (uint256)",
        "function lastWinner() view returns (address)",
        "function lastPrize() view returns (uint256)",
        "event TicketPurchased(address indexed player, uint256 quantity, uint256 roundNumber)",
        "event WinnerSelected(address indexed winner, uint256 prize, uint256 roundNumber)"
    ]
};let provider;
let signer;
let contract;
let userAddress;
let currentTicketPrice = 0n;

const connectBtn = document.getElementById("connectBtn");
const buyBtn = document.getElementById("buyBtn");
const drawBtn = document.getElementById("drawBtn");
const quantityInput = document.getElementById("quantity");

const statusText = document.getElementById("status");

function setStatus(message) {
    statusText.textContent = message;
}

function formatETH(value) {
    return Number(ethers.formatEther(value)).toFixed(5) + " ETH";
}

async function connectWallet() {
    try {
        if (!window.ethereum) {
            setStatus("MetaMask is not installed. Please install MetaMask.");
            return;
        }

        provider = new ethers.BrowserProvider(window.ethereum);

        await provider.send("eth_requestAccounts", []);

        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        const network = await provider.getNetwork();

        if (Number(network.chainId) !== APP_CONFIG.networkId) {
            setStatus("Please switch MetaMask to Ethereum Sepolia.");
            return;
        }

        contract = new ethers.Contract(
            APP_CONFIG.contractAddress,
            APP_CONFIG.abi,
            signer
        );

        connectBtn.textContent =
            userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

        setStatus("Wallet connected successfully.");

        await refreshData();

    } catch (error) {
        console.error(error);
        setStatus(error.shortMessage || error.message);
    }
}

async function refreshData() {
    if (!contract || !userAddress) {
        return;
    }

    try {
        const [
            prizePool,
            playerCount,
            ticketPrice,
            myTickets,
            owner,
            winner,
            prize,
            round
        ] = await Promise.all([
            contract.getPrizePool(),
            contract.getPlayerCount(),
            contract.ticketPrice(),
            contract.getMyTickets(userAddress),
            contract.owner(),
            contract.lastWinner(),
            contract.lastPrize(),
            contract.roundNumber()
        ]);

        currentTicketPrice = ticketPrice;

        document.getElementById("prizePool").textContent =
            formatETH(prizePool);

        document.getElementById("playerCount").textContent =
            playerCount.toString();

        document.getElementById("ticketPrice").textContent =
            formatETH(ticketPrice);

        document.getElementById("myTickets").textContent =
            myTickets.toString();

        document.getElementById("lastWinner").textContent =
            winner === ethers.ZeroAddress ? "No winner yet" : winner;

        document.getElementById("lastPrize").textContent =
            formatETH(prize);

        document.getElementById("roundNumber").textContent =
            round.toString();

        const isOwner =
            owner.toLowerCase() === userAddress.toLowerCase();

        document.getElementById("ownerPanel").classList.toggle(
            "hidden",
            !isOwner
        );

        updateTotalPrice();

    } catch (error) {
        console.error(error);
        setStatus("Unable to load contract information.");
    }
}

function updateTotalPrice() {
    const quantity = Number(quantityInput.value);

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
    ) {
        document.getElementById("totalPrice").textContent = "Invalid quantity";
        return;
    }

    const total = currentTicketPrice * BigInt(quantity);

    document.getElementById("totalPrice").textContent =
        formatETH(total);
}

async function buyTickets() {
    try {
        if (!contract) {
            setStatus("Please connect your wallet first.");
            return;
        }

        const quantity = Number(quantityInput.value);

        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 20
        ) {
            setStatus("Please select between 1 and 20 tickets.");
            return;
        }

        const totalPrice = currentTicketPrice * BigInt(quantity);

        setStatus("Waiting for transaction confirmation...");
        buyBtn.disabled = true;

        const transaction = await contract.buyTickets(quantity, {
            value: totalPrice
        });

        setStatus("Transaction submitted. Waiting for confirmation...");

        await transaction.wait();

        setStatus("Tickets purchased successfully!");

        await refreshData();

    } catch (error) {
        console.error(error);
        setStatus(error.shortMessage || error.message);
    } finally {
        buyBtn.disabled = false;
    }
}

async function drawWinner() {
    try {
        if (!contract) {
            setStatus("Please connect your wallet first.");
            return;
        }

        setStatus("Checking lottery information...");

        const owner = await contract.owner();
        const playerCount = await contract.getPlayerCount();

        if (owner.toLowerCase() !== userAddress.toLowerCase()) {
            setStatus("Only the contract owner can draw a winner.");
            return;
        }

        if (playerCount === 0n) {
            setStatus("There are no tickets in this round.");
            return;
        }

        const confirmed = confirm("Are you sure you want to draw a winner?");

        if (!confirmed) {
            setStatus("Winner draw cancelled.");
            return;
        }

        drawBtn.disabled = true;
        setStatus("Drawing winner. Please wait...");

        const transaction = await contract.drawWinner();

        await transaction.wait();

        setStatus("Winner selected successfully!");

        await refreshData();

    } catch (error) {
        console.error(error);
        setStatus(error.shortMessage || error.message);
    } finally {
        drawBtn.disabled = false;
    }
}

connectBtn.addEventListener("click", connectWallet);
buyBtn.addEventListener("click", buyTickets);
drawBtn.addEventListener("click", drawWinner);

quantityInput.addEventListener("input", updateTotalPrice);

if (window.ethereum) {
    window.ethereum.on("accountsChanged", function() {
        window.location.reload();
    });

    window.ethereum.on("chainChanged", function() {
        window.location.reload();
    });
}