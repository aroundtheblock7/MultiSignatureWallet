const { assert } = require('chai');
describe('MultiSigWallet', function () {
    let contract;
    let accounts;
    beforeEach(async () => {
        accounts = await ethers.provider.listAccounts();
        const MultiSig = await ethers.getContractFactory("MultiSigWallet");
        contract = await MultiSig.deploy(accounts.slice(0, 3), 1);
        await contract.deployed();
    });

    describe('storing ERC20 tokens', function () {
        const initialBalance = 10000;
        let token;

        beforeEach(async () => {
            const EIP20 = await ethers.getContractFactory("EIP20");
            token = await EIP20.deploy('My Token', 'MT');
            await token.deployed();
            await token.transfer(contract.address, initialBalance);
        });

        it('should store the balance', async () => {
            const balance = await token.balanceOf(contract.address);
            assert.equal(balance.toNumber(), initialBalance);
        });

        //Note this submits, confirms, and executes the tx all at once because we only require 1 approval! 
        //We send to token.address but the data contains the account (accounts[2]) at that address that we send to)
        describe('executing an ERC20 transaction', function () {
            beforeEach(async () => {
                const data = token.interface.encodeFunctionData("transfer", [accounts[2], initialBalance]);
                await contract.submitTransaction(token.address, 0, data);
            });

            it('should have removed the contract balance', async () => {
                const balance = await token.balanceOf(contract.address);
                assert.equal(balance.toNumber(), 0);
            });

            it('should have moved the balance to the destination', async () => {
                const balance = await token.balanceOf(accounts[2]);
                assert.equal(balance.toNumber(), initialBalance);
            });
        });
    });

    describe('storing ether', function () {
        const oneEther = ethers.utils.parseEther("1");
        beforeEach(async () => {
            await ethers.provider.getSigner(0).sendTransaction({ to: contract.address, value: oneEther });
        });

        it('should store the balance', async () => {
            const balance = await ethers.provider.getBalance(contract.address);
            assert.equal(balance.toString(), oneEther.toString());
        });

        describe('executing the ether transaction', function () {
            let balanceBefore;

            //When we submit the tx here we don't need to store anything in data becuase we are dealing with Eth
            //We put the account (account[1]) as the destination. Not the "token contract" as we do when sending other tokens
            beforeEach(async () => {
                balanceBefore = await ethers.provider.getBalance(accounts[1]);
                await contract.submitTransaction(accounts[1], oneEther, "0x");
            });

            it('should have removed the contract balance', async () => {
                const balance = await ethers.provider.getBalance(contract.address);
                assert.equal(balance, 0);
            });

            it('should have moved the balance to the destination', async () => {
                const balance = await ethers.provider.getBalance(accounts[1]);
                assert.equal(balance.sub(balanceBefore).toString(), oneEther.toString());
            });
        });
    });
});

