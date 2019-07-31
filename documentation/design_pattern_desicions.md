## Fail early and fail loud
Throughout Marketplace contract, `require` statements are executed as early as possible to avoid meaningless gas consumption. It's a good practice to reduce unneccessary code execution if conditions are not met.

## Restricting Access

We have restricted other contracts’ access to the state by making most of state variables private. There are some public state variables because it's required to be read by dApp.

Most of the functions are restricted according to the roles such as `owner`, `storeOwner`, `admin`.

## Mortal
We have implemented the mortal design pattern which allows us the ability to destroy the contract and remove it from the blockchain, and also transferring funds to the `owner`.

## Circuit Breaker

Circuit Breaker pattern is required because the contract can be vulnerable and in the case of detecting this vulnerability the contract owner can pause the state updates on the contract. It creates time to the maintainers and if the contract is not upgradable, they can even take a snapshot and migrate to the new Contract. It can be said as a point of centralization but considering the funds in the contract, it seems inevitable , so far.


## Withdrawal Pattern

A malicious store owner can be a contract that throws when a payment is transferred to the address. Even, we may think that the admin would not add a malicious contract as store owner, we still have to care about this situation. Therefore, we have used the withdrawal pattern that requires invocation by individuals. As the attacker would not have any incentive to attack, withdrawal pattern is considered the most secure for refunding.



