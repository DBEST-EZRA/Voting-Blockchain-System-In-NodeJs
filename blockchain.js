const express = require("express");
const bodyParser = require("body-parser");
const SHA256 = require("crypto-js/sha256");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

class Block {
  constructor(index, timestamp, votes, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.votes = votes;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.votes) +
        this.nonce
    ).toString();
  }

  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log("mined Block: " + this.hash);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.votes = {
      John: 0,
      Jane: 0,
      Jerry: 0,
    };
    this.auditLog = [];
  }

  createGenesisBlock() {
    return new Block(0, "01/01/2024", this.votes);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
  }

  vote(candidate) {
    if (!this.votes.hasOwnProperty(candidate)) {
      return { error: "Invalid candidate" };
    }
    this.votes[candidate]++;
    const newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      this.votes
    );
    this.addBlock(newBlock);
    this.auditLog.push({ candidate, timestamp: new Date().toISOString() });
    return { message: "Vote casted!" };
  }

  getResults() {
    return this.votes;
  }

  getWinner() {
    let maxVotes = -1;
    let winner = "";
    for (let candidate in this.votes) {
      if (this.votes[candidate] > maxVotes) {
        maxVotes = this.votes[candidate];
        winner = candidate;
      }
    }
    return winner;
  }

  getAuditLog() {
    return this.auditLog;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

let blockchain = new Blockchain();

app.get("/blockchain", (req, res) => {
  res.send(blockchain);
});

app.post("/vote", (req, res) => {
  const { candidate } = req.body;
  const result = blockchain.vote(candidate);
  res.send(result);
});

app.get("/results", (req, res) => {
  res.send(blockchain.getResults());
});

app.get("/winner", (req, res) => {
  res.send({ winner: blockchain.getWinner() });
});

app.get("/audit-log", (req, res) => {
  res.send(blockchain.getAuditLog());
});

app.post("/sync", (req, res) => {
  const newChain = req.body.chain;
  if (blockchain.chain.length < newChain.length) {
    blockchain.chain = newChain;
    res.send({ message: "Chain updated!" });
  } else {
    res.send({ message: "Chain is already up-to-date!" });
  }
});

app.listen(PORT, () => {
  console.log(`Node running on port ${PORT}`);
});
