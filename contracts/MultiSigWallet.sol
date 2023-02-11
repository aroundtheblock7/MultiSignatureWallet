// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract MultiSigWallet {
    address[] public owners;
    uint public required;
    uint public transactionCount;

    constructor(address[] memory _owners, uint _required) payable {
        require(_owners.length > 0);
        require(_required > 0);
        require(_required <= _owners.length);
        owners = _owners;
        required = _required;
    }

  
    mapping(uint => Transaction) public transactions;

    mapping(uint => mapping(address => bool)) public confirmations;

    struct Transaction {
        address destination;
        uint amount;
        bool executed;
        bytes data;
    }

    function totalTransactionCount() public view returns (uint) {
        return transactionCount;
    }

    function addTransaction(address payable _destination, uint _amount, bytes memory _data) internal returns (uint transactionId) {
        transactionId = transactionCount;
        transactions[transactionCount] = Transaction(_destination, _amount, false, _data);
        transactionCount += 1;
    }

    function confirmTransaction (uint id) public {
        require(isOwner(msg.sender));
        confirmations[id][msg.sender] = true;
        if(isConfirmed(id) == true) {
            executeTransaction(id);
        }
    }

    function getConfirmationsCount(uint transactionId) public view returns (uint) {
        uint count = 0;
        for(uint i=0; i<owners.length; i++) {
            if(confirmations[transactionId][owners[i]] == true) {
                count++;
            }
        }
        return count;
    }

    function isOwner(address _address) public view returns (bool) {
        for(uint i=0; i<owners.length; i++) {
            if(owners[i] == _address) {
                return true;
            }
        }
        return false;
    }

    function submitTransaction(address payable _destination, uint _amount, bytes memory _data) external {
        uint id = addTransaction(_destination, _amount, _data);
        confirmTransaction(id);
    }

    function isConfirmed(uint transactionId) public view returns (bool) {
        uint count = 0;
        for (uint i=0; i<owners.length; i++) {
            if(confirmations[transactionId][owners[i]] == true) {
                count++;
            }
            if(count >= required) {
                return true;
            }
        }
        return false;
    }

    function isConfirmed2(uint transactionId) public view returns (bool) {
        return getConfirmationsCount(transactionId) >= required;
    }

    function executeTransaction(uint transactionId) public payable {
        require(isConfirmed(transactionId), "This is is not yet confirmed");
        require(isOwner(msg.sender));
        (bool success, ) = transactions[transactionId].destination.call{value: transactions[transactionId].amount}(transactions[transactionId].data);
        require(success, "Transaction Failed");
        transactions[transactionId].executed = true;
    }

    function executeTransaction2(uint transactionId) public {
        require(isConfirmed(transactionId));
        Transaction storage _tx = transactions[transactionId];
        (bool success, ) = _tx.destination.call{ value: _tx.amount }(_tx.data);
        require(success, "Failed to execute transaction");
        _tx.executed = true;
    }


    receive() external payable {}

}
