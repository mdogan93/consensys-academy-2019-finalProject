pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract ACAToken is ERC20{

    string public name = 'Aron Cardo Afore';

    string public symbol = 'ACA';

    uint8 public decimals = 18;

    uint256 public INITIAL_SUPPLY = 1e9 * (1e18);

    constructor() public {
        _mint(msg.sender, INITIAL_SUPPLY);

    }

}
