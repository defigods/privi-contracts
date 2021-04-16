const PRIVIPodERC1155Token = artifacts.require("PRIVIPodERC1155Token");
const PRIVIPodERC1155Factory = artifacts.require("PRIVIPodERC1155Factory");
const AtomicSwapERC1155 = artifacts.require("AtomicSwapERC1155Mock");
const BridgeManager = artifacts.require("BridgeManager");

const { BN, soliditySha3 } = require("web3-utils");

function getUnixEpochTimeStamp(value) {
    return Math.floor(value.getTime() / 1000);
}

contract("AtomicSwapERC1155", (accounts) => {
    let PRIVIPodERC1155Token_contract;
    let PRIVIPodERC1155Factory_contract;
    let AtomicSwapERC1155_contract;
    let BridgeManager_contract;

    const podId1 = 'podId1'
    const podUri = '123'
    let podAdress1;
    const tokenId = '0x222222229bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654175555';

    before(async () => {
        await BridgeManager.new({ from: accounts[0] }).then(function (instance) {
            BridgeManager_contract = instance;
        });

        await PRIVIPodERC1155Factory.new(BridgeManager_contract.address, { from: accounts[0] }).then(function (instance) {
            PRIVIPodERC1155Factory_contract = instance;
        });

        await AtomicSwapERC1155.new({ from: accounts[0] }).then(function (instance) {
            AtomicSwapERC1155_contract = instance;
        });

        await PRIVIPodERC1155Factory_contract.createPod(
            podUri,
            podId1,
        )

        podAdress1 = await PRIVIPodERC1155Factory_contract.getPodAddressById(podId1);

        await PRIVIPodERC1155Factory_contract.mintPodTokenById(
            podId1,
            accounts[1],
            tokenId,
            1000,
            '0x1234',
            {from: accounts[0]}
        )

        PRIVIPodERC1155Token_contract = await PRIVIPodERC1155Token.at(podAdress1);
    });

    describe("atomic swap", () => {
        it("everything is working fine with normal flow", async () => {

            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC1155Token_contract.setApprovalForAll(
                AtomicSwapERC1155_contract.address,
                true,
                { from: accounts[1] }
            );

            await AtomicSwapERC1155_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce",
                tokenId,
                "100",
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            await AtomicSwapERC1155_contract.claimFunds(
                '0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                {from: accounts[2]}
            );

            assert.equal(new BN(await PRIVIPodERC1155Token_contract.balanceOf(accounts[2], tokenId), {from: accounts[0]}).toString(), 100);
        });

        it("claiming funds is not working with wrong secret or wrong swap id", async () => {

            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC1155Token_contract.setApprovalForAll(
                AtomicSwapERC1155_contract.address,
                true,
                { from: accounts[1] }
            );

            await AtomicSwapERC1155_contract.createProposal(
                "0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce",
                tokenId,
                "100",
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            try {
                await AtomicSwapERC1155_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ca',
                    {from: accounts[2]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC1155: Invalid secret key',
            )

            try {
                await AtomicSwapERC1155_contract.claimFunds(
                    '0x851f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[2]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC1155: Swap is not opened',
            )
        });

        it("claiming funds is not working from faker", async () => {
            try {
                await AtomicSwapERC1155_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[9]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC1155: Caller is not the withdrawer',
            )
        });

        it("only working with all correct information", async () => {
            await AtomicSwapERC1155_contract.claimFunds(
                '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                {from: accounts[2]}
            );

            assert.equal(new BN(await PRIVIPodERC1155Token_contract.balanceOf(accounts[2], tokenId), {from: accounts[0]}).toString(), 200);
        });

        it("not working if withdraw trader try to claim again", async () => {
            let thrownError;

            try {
                await AtomicSwapERC1155_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[2]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC1155: Swap is not opened',
            )
        });

        it("refund", async () => {
            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC1155Token_contract.setApprovalForAll(
                AtomicSwapERC1155_contract.address,
                true,
                { from: accounts[1] }
            );

            await AtomicSwapERC1155_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747cf",
                tokenId,
                "100",
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x541f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            date.setDate(date.getDate() + 2);
            await AtomicSwapERC1155_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));


            await AtomicSwapERC1155_contract.refundFunds(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747cf",
                {from: accounts[1]}
            );

            assert.equal(new BN(await PRIVIPodERC1155Token_contract.balanceOf(accounts[1], tokenId), {from: accounts[0]}).toString(), 800);
        });

        it("refunding is not working while timelock", async () => {
            let date = new Date();
            date.setDate(date.getDate() + 30);

            await PRIVIPodERC1155Token_contract.setApprovalForAll(
                AtomicSwapERC1155_contract.address,
                true,
                { from: accounts[1] }
            );

            await AtomicSwapERC1155_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                tokenId,
                "100",
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x541f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            let thrownError;

            try {
                await AtomicSwapERC1155_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[1]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC1155: Swap is not expired',
            )
        });

        it("refunding is not working from faker", async () => {
            let date = new Date();

            date.setDate(date.getDate() + 60);
            await AtomicSwapERC1155_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));

            let thrownError;

            try {
                await AtomicSwapERC1155_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[9]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC1155: Caller is not the proposer',
            )
        });

        it("refunding is only working from trader after time lock", async () => {
            let date = new Date();

            date.setDate(date.getDate() + 60);
            await AtomicSwapERC1155_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));

            await AtomicSwapERC1155_contract.refundFunds(
                "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                {from: accounts[1]}
            );

            assert.equal(new BN(await PRIVIPodERC1155Token_contract.balanceOf(accounts[1], tokenId), {from: accounts[0]}).toString(), 800);
        });

        it("not working if trader refund again", async () => {
            let thrownError;

            try {
                await AtomicSwapERC1155_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[1]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC1155: Swap is not opened',
            )
        });
    });
});
