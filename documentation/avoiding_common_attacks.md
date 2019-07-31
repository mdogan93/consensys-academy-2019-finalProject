# Summary
Bugs in solidity can be dangeorous in terms of the cost. Checking the short story of  Ethereum you may face some attacks causing Million Dolar Losses in a single bug, such as DAOHack, Parity MultisigHack. In Ethereum where money is a living actor, it's important to guarentee security and present simplicity and consistency in the contract. Reviewing earlier hacks and known attacks are one of the most critical concers for any blockchain developer. So, I first went-over the known vulnerabilities and modified the contract if it's neccessary.

## Reentrancy

Externall calls in the contract can execute malicious code in another contract and this may be result in re-entrancy attack. 
In the MarketPlace contract, to avoid re-entracy attacks, the contract state updates are executed before transferring Ether or ERC-20 tokens. So that, even the transactions will fail it will revert and user's balance would be unaffected.

## Cross-function reentrancy
An attacker may also execute re-entrancy attack using two different functions that share the same state. For example, in our contract both `purchaseProduct` and `withdrawBalance` and updates ``balances`` mapping. While the `purchaseProduct` funtion increases the funds of storeOwner, `withdrawBalance` sets storeOwner's balance to zero. Therefore, we avoid this attack by using setting contract state before any external calls.

## Overflows/Underflows
As solidity language based on unsigned integers, it's important to prevent these kind of bugs. In our contract, we update the storeOwner's `balances` frequently, in each purchase of product and withdrawal. It can be possible to set storeOwner's balance to MAX_VALUE accidentally. To overcome this issue, all arithmetic operations in the contract are done by using `SafeMath` Library by openzeppelin. Therefore, there is no vulnerability related to integer operations on the contract 

## Transaction Ordering and Timestamp Dependence

These kind of attacks arise due to malicious miners. I don't see any concern related to Transasction Ordering in marketplace. Because, the attacker would have no incentive to buy any product from others, this should not be considered as vulnerability.

## Denial Of Service
There is no any array iteration on state-update transactions, so that DoS by Block Gas Limit is not possible in the MarketPlace contract. As, we have used withdrawal pattern in our contract, it is also not possible to block any function with external calls.

## Force Sending Ether
The balances in the contract are managed with the states defined in the contract. As, there is no `address(this).balance` or similar expressions, the contract can be considered as secure against these kind of attacks.
