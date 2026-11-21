// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LuckyVault {
    address public owner;
    uint256 public ticketPrice;

    address[] private players;

    uint256 public roundNumber;
    address public lastWinner;
    uint256 public lastPrize;

    event TicketPurchased(
        address indexed player,
        uint256 quantity,
        uint256 roundNumber
    );

    event WinnerSelected(
        address indexed winner,
        uint256 prize,
        uint256 roundNumber
    );

    event TicketPriceUpdated(uint256 newPrice);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 _ticketPrice) {
        require(_ticketPrice > 0, "Ticket price must be positive");

        owner = msg.sender;
        ticketPrice = _ticketPrice;
        roundNumber = 1;
    }

    function buyTickets(uint256 quantity) external payable {
        require(quantity > 0 && quantity <= 20, "Quantity must be 1-20");
        require(
            msg.value == ticketPrice * quantity,
            "Incorrect ETH amount"
        );

        for (uint256 i = 0; i < quantity; i++) {
            players.push(msg.sender);
        }

        emit TicketPurchased(msg.sender, quantity, roundNumber);
    }

    function drawWinner() external onlyOwner {
        require(players.length > 0, "No tickets sold");

        uint256 index = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    players.length,
                    address(this)
                )
            )
        ) % players.length;

        address winner = players[index];
        uint256 prize = address(this).balance;

        lastWinner = winner;
        lastPrize = prize;

        delete players;
        roundNumber += 1;

        (bool sent, ) = payable(winner).call{value: prize}("");
        require(sent, "Prize transfer failed");

        emit WinnerSelected(winner, prize, roundNumber - 1);
    }

    function setTicketPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be positive");

        ticketPrice = newPrice;
        emit TicketPriceUpdated(newPrice);
    }

    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }

    function getMyTickets(
        address account
    ) external view returns (uint256 count) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == account) {
                count++;
            }
        }
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
}
