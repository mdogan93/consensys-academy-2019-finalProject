pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract BUMToken is ERC20{

    string public name = 'Bruno Umma Mano';

    string public symbol = 'BUM';

    uint8 public decimals = 18;

    uint256 public INITIAL_SUPPLY = 1e9 * (1e18);

    constructor() public {
        _mint(msg.sender, INITIAL_SUPPLY);

    }

}
