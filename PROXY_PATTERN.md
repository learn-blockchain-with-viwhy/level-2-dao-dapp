# Proxy Pattern (Upgradeable Contract) - Guide

## 📋 Overview

This project has integrated **Proxy Pattern (UUPS - Universal Upgradeable Proxy
Standard)** to allow contract upgrades without losing data.

## 🏗️ Architecture

### Main Contracts:

1. **UUPSProxy.sol** - Proxy contract, this address does not change
2. **VotingV1.sol** - Implementation contract version 1
3. **VotingV2.sol** - Implementation contract version 2 (with additional
   features)

### How it works:

```
User → Proxy Contract → Implementation Contract (V1 or V2)
```

-   Proxy contract stores data (state)
-   Implementation contract contains logic
-   When upgrading, only the implementation changes, data remains intact

## 🚀 Deployment

### 1. Deploy Proxy with VotingV1

```bash
npx hardhat ignition deploy ignition/modules/ProxyVotingModule.ts --network sepolia
```

After deployment, you will receive:

-   `votingV1`: Address of VotingV1 implementation
-   `proxy`: Address of proxy contract (this is the address you will use)

### 2. Deploy VotingV2 (when upgrade is needed)

```bash
npx hardhat ignition deploy ignition/modules/VotingV2Module.ts --network sepolia
```

Save the address of `votingV2` to use when upgrading.

## 🔄 Upgrade Contract

### Method 1: Using Interactive Menu

```bash
npm run menu
```

Select option **8. 🔄 Upgrade Contract (Proxy)** and follow the instructions.

### Method 2: Using Script

1. Add to `.env` file:

```env
PROXY_ADDRESS=0x...  # Proxy contract address
NEW_IMPLEMENTATION=0x...  # VotingV2 contract address
```

2. Run script:

```bash
tsx scripts/upgrade.ts
```

### Method 3: Using Hardhat Console

```javascript
const proxy = await ethers.getContractAt('UUPSProxy', 'PROXY_ADDRESS');
await proxy.upgradeTo('VOTINGV2_ADDRESS');
```

## 📊 View Proxy Information

### Using Menu:

```bash
npm run menu
# Select option 9. 📊 View Proxy Info
```

### Or call directly:

```javascript
const proxy = await ethers.getContractAt('UUPSProxy', 'PROXY_ADDRESS');
const implementation = await proxy.getImplementation();
const admin = await proxy.getAdmin();
```

## 🔐 Security

-   **Only admin can upgrade** the contract
-   Admin is set when deploying the proxy
-   Admin cannot be changed after deployment (in current implementation)

## 📝 Important Notes

1. **Storage Layout**: When upgrading, the order of state variables in storage
   slots must remain unchanged
2. **Initialization**: VotingV2 has an `initializeV2()` function to initialize
   new variables
3. **Testing**: Always test upgrades on testnet before deploying to mainnet
4. **Backup**: Save the addresses of all implementation contracts

## 🆕 New Features in VotingV2

-   `getVersion()` - Get contract version
-   `totalVotes` - Total votes across all proposals
-   `voteHistory` - More detailed vote history
-   `ProposalClosed` event - New event when closing a proposal

## 📚 References

-   [EIP-1967: Proxy Storage Slots](https://eips.ethereum.org/EIPS/eip-1967)
-   [UUPS Pattern](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#uups-proxies)
-   [Hardhat Ignition](https://hardhat.org/ignition/docs/overview)

## ⚠️ Warnings

-   Upgrade is **irreversible**
-   Ensure the new implementation is compatible with the old storage layout
-   Test thoroughly before upgrading on mainnet
-   Only upgrade when truly necessary
