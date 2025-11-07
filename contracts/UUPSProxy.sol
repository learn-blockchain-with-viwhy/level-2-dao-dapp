// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title UUPSProxy
 * @dev Simple UUPS (Universal Upgradeable Proxy Standard) Proxy Contract
 * This proxy delegates all calls to the implementation contract
 */
contract UUPSProxy {
    // Storage slot for implementation address (EIP-1967)
    bytes32 private constant IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    // Storage slot for admin address (EIP-1967)
    bytes32 private constant ADMIN_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    constructor(address implementation, address admin, bytes memory initData) {
        // Set implementation address
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, implementation)
        }

        // Set admin address
        slot = ADMIN_SLOT;
        assembly {
            sstore(slot, admin)
        }

        // Call initialize function on implementation if initData is provided
        if (initData.length > 0) {
            (bool success, bytes memory returnData) = implementation
                .delegatecall(initData);
            if (!success) {
                if (returnData.length > 0) {
                    assembly {
                        let returndata_size := mload(returnData)
                        revert(add(32, returnData), returndata_size)
                    }
                } else {
                    revert('Initialization failed');
                }
            }
        }
    }

    /**
     * @dev Upgrade the implementation contract (only admin)
     */
    function upgradeTo(address newImplementation) external {
        require(msg.sender == _getAdmin(), 'Only admin can upgrade');
        require(newImplementation != address(0), 'Invalid implementation');

        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }

        // Call upgradeTo on new implementation to emit event
        (bool success, bytes memory returnData) = newImplementation
            .delegatecall(
                abi.encodeWithSignature('upgradeTo(address)', newImplementation)
            );
        if (!success) {
            if (returnData.length > 0) {
                assembly {
                    let returndata_size := mload(returnData)
                    revert(add(32, returnData), returndata_size)
                }
            } else {
                revert('Upgrade failed');
            }
        }
    }

    /**
     * @dev Fallback function that delegates calls to the implementation contract
     */
    fallback() external payable {
        address implementation = _getImplementation();

        assembly {
            // Copy msg.data to memory
            calldatacopy(0, 0, calldatasize())

            // Call implementation contract
            let result := delegatecall(
                gas(),
                implementation,
                0,
                calldatasize(),
                0,
                0
            )

            // Copy return data to memory
            returndatacopy(0, 0, returndatasize())

            // Return or revert
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @dev Receive function for receiving Ether
     */
    receive() external payable {
        // Delegate to implementation if it has a receive function
        address implementation = _getImplementation();
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(
                gas(),
                implementation,
                0,
                calldatasize(),
                0,
                0
            )
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @dev Get the current implementation address
     */
    function _getImplementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }

    /**
     * @dev Get the current admin address
     */
    function _getAdmin() internal view returns (address admin) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            admin := sload(slot)
        }
    }

    /**
     * @dev Get implementation address (public view function)
     */
    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @dev Get admin address (public view function)
     */
    function getAdmin() external view returns (address) {
        return _getAdmin();
    }
}
