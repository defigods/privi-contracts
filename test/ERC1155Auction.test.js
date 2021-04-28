const BridgeManager = artifacts.require('BridgeManager');
const ERC1155AuctionMock = artifacts.require("ERC1155AuctionMock");
const PodERC1155Factory = artifacts.require('PRIVIPodERC1155Factory');
const PodERC1155Token = artifacts.require('PRIVIPodERC1155Token');

const { BN } = require("web3-utils");

contract("ERC1155Auction", (accounts) => {
    var auction_contract;
    var erc1155TokenContract;
    var podERC1155Factory;
    const tokenId = "0x222222229bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612"; // Randomly chosen
    const startBidPrice = new BN('100000000000000000');
    const NO_DATA = web3.utils.fromAscii('nothing');

    before(async () => {
        // Bridge contract
        bridgeManagerContract = await BridgeManager.new({ from: accounts[0] });

        // Factory contracts
        podERC1155Factory = await PodERC1155Factory.new(bridgeManagerContract.address, { from: accounts[0] });

        // TST Token creation
        await podERC1155Factory.createPod('ipfs://test0', { from: accounts[0] });

        const podAddress = await podERC1155Factory.getPodAddressByUri('ipfs://test0');
        erc1155TokenContract = await PodERC1155Token.at(podAddress);

        await ERC1155AuctionMock.new(
            erc1155TokenContract.address,
            accounts[4],
            { from: accounts[0] }
        ).then(function (instance) {
            auction_contract = instance;
        });
    });

    describe("auction with single token", () => {
        it("creating auction not working if caller has not approved", async () => {
            await podERC1155Factory.mintPodTokenByUri(
                'ipfs://test0', // pod uri
                accounts[1],      // to
                tokenId,              // tokenId
                100,            // amount
                NO_DATA,        // data
                { from: accounts[0] }
            );

            let thrownError;
            try {
                await auction_contract.createAuction(
                    tokenId,
                    startBidPrice,
                    '0',
                    '1716922014',
                    { from: accounts[1] }
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.createAuction: Owner has not approved',
            )
        });
        it("creating auction not working if caller is not the owner of the token", async () => {
            await erc1155TokenContract.setApprovalForAll(
                auction_contract.address,
                true,
                { from: accounts[1] }
            );

            let thrownError;
            try {
                await auction_contract.createAuction(
                    tokenId,
                    startBidPrice,
                    '0',
                    '1716922014',
                    { from: accounts[2] }
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.createAuction: Caller does not have the token',
            )
        });
        it("creating auction not working if end time is before now", async () => {
            let thrownError;
            try {
                await auction_contract.createAuction(
                    tokenId,
                    startBidPrice,
                    '0',
                    '1',
                    { from: accounts[1] }
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.createAuction: End time passed. Nobody can bid',
            )
        });
        it("creating auction not working if end time smaller than start time", async () => {
            let thrownError;
            try {
                await auction_contract.createAuction(
                    tokenId,
                    startBidPrice,
                    '1',
                    '0',
                    { from: accounts[1] }
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.createAuction: End time must be greater than start',
            )
        });
        it("creating auction is working fine with all correct info", async () => {
            //create Auction
            await auction_contract.createAuction(
                tokenId,
                startBidPrice,
                '0',
                '1716922014',
                { from: accounts[1] }
            );

            //Auction Created Correctly
            let auctionInfo = await auction_contract.getAuction(tokenId, accounts[1]);

            assert.equal(auctionInfo.startTime, new BN('0'));
            assert.equal(auctionInfo.endTime, new BN('1716922014'));
        });
        it("bid amount should be higer than start bid price", async () => {
            const bid = {
                from: accounts[2],
                value: new BN('25000000000000000'),
            };

            let thrownError;
            try {
                await auction_contract.placeBid(
                    tokenId,
                    accounts[1],
                    bid
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.placeBid: Bid amount should be higher than start price',
            )
        });
        it("bid amount should be min bid incremental amount higher than prev bid amount", async () => {
            const bids = [
                {
                    from: accounts[2],
                    value: new BN('325000000000000000'),
                },
                {
                    from: accounts[3],
                    value: new BN('424000000000000000'),
                },
            ]
            await auction_contract.placeBid(
                tokenId,
                accounts[1],
                bids[0]
            );

            let thrownError;
            try {
                await auction_contract.placeBid(
                    tokenId,
                    accounts[1],
                    bids[1]
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.placeBid: Failed to outbid highest bidder',
            )
        });
        it("working bid", async () => {
            //Bidding
            const bids = [
                {
                    from: accounts[5],
                    value: new BN('625000000000000000'),
                },
                {
                    from: accounts[6],
                    value: new BN('725000000000000000'),
                },
                {
                    from: accounts[7],
                    value: new BN('825000000000000000'),
                },
                {
                    from: accounts[8],
                    value: new BN('925000000000000000'),
                },
                {
                    from: accounts[9],
                    value: new BN('2000000000000000000'),
                },
            ];

            const bidTimes = [
                '1716922000',
                '1716922300',
                '1716922600',
                '1716922600',
                '1716922600',
            ]

            let auctionOriginEndTime = new BN('1716922014');

            const beforeBalances = [
                new BN(await web3.eth.getBalance(accounts[5])),
                new BN(await web3.eth.getBalance(accounts[6])),
                new BN(await web3.eth.getBalance(accounts[7])),
                new BN(await web3.eth.getBalance(accounts[8])),
                new BN(await web3.eth.getBalance(accounts[9])),
            ]

            for(let i = 0; i < 3; i++) {
                await auction_contract.setBlockTimeStamp(bidTimes[i], {from: accounts[0]});
                const receipt = await auction_contract.placeBid(
                    tokenId,
                    accounts[1],
                    bids[i]
                );

                //Auction End time is increased because bid time is more than 5 mins before end time
                let auctionInfo = await auction_contract.getAuction(tokenId, accounts[1]);
                assert.equal(auctionInfo.endTime, auctionOriginEndTime.add(new BN(300 * (i + 1))).toString())

                const tx = await web3.eth.getTransaction(receipt.tx);
                const gasFee = new BN(receipt.receipt.gasUsed).mul(new BN(tx.gasPrice));
                bids[i].gasFee = gasFee;
            }

            auctionOriginEndTime = auctionOriginEndTime.add(new BN(300 * 3));

            for(let i = 3; i < bids.length; i++) {
                await auction_contract.setBlockTimeStamp(bidTimes[i], {from: accounts[0]});
                const receipt = await auction_contract.placeBid(
                    tokenId,
                    accounts[1],
                    bids[i]
                );

                //Auction End time is not increased because bid time is no more than 5 mins before end time
                let auctionInfo = await auction_contract.getAuction(tokenId, accounts[1]);
                assert.equal(auctionInfo.endTime, auctionOriginEndTime.toString());

                const tx = await web3.eth.getTransaction(receipt.tx);
                const gasFee = new BN(receipt.receipt.gasUsed).mul(new BN(tx.gasPrice));
                bids[i].gasFee = gasFee;
            }

            //Bidding works correctly
            const afterBalances = [
                new BN(await web3.eth.getBalance(accounts[5])),
                new BN(await web3.eth.getBalance(accounts[6])),
                new BN(await web3.eth.getBalance(accounts[7])),
                new BN(await web3.eth.getBalance(accounts[8])),
                new BN(await web3.eth.getBalance(accounts[9])),
            ]

            for(let i = 0; i < 2; i++) {
                assert.equal(beforeBalances[i].sub(bids[i].gasFee).toString(), afterBalances[i].toString())
            }

            for(let i = 2; i < bids.length; i++) {
                assert.equal(beforeBalances[i].sub(bids[i].value).sub(bids[i].gasFee).toString(), afterBalances[i])
            }
        })
        
        it("result auction is not working if caller is not the owner or admin", async () => {
            let thrownError;
            try {
                await auction_contract.endAuction(tokenId, accounts[1], {from: accounts[9]});
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.endAuction: only Admin can result the auction',
            )
        });
        it("result auction is not working if it is before end time", async () => {
            let thrownError;
            try {
                await auction_contract.endAuction(tokenId, accounts[1], {from: accounts[1]});
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.endAuction: The auction has not ended',
            )
        });
        it("result auction", async () => {
            const OwnerBeforeBalance = new BN(await web3.eth.getBalance(accounts[1]))
            const serviceFeeRecipientBeforeBalance = new BN(await web3.eth.getBalance(accounts[4]))

            //manipulate auction contract time
            await auction_contract.setBlockTimeStamp('1816922014', {from: accounts[0]});

            //finish auction
            const receipt = await auction_contract.endAuction(tokenId, accounts[1], {from: accounts[1]});
            const tx = await web3.eth.getTransaction(receipt.tx);
            const gasFee = new BN(receipt.receipt.gasUsed).mul(new BN(tx.gasPrice));

            //Token transfered correctly
            assert.equal(await erc1155TokenContract.balanceOf(accounts[9], tokenId), 1);
            
            //Calculate balance of token owner and service fee recipient
            const OwnereBalance = new BN(await web3.eth.getBalance(accounts[1]))
            const serviceFeeRecipientBalance = new BN(await web3.eth.getBalance(accounts[4]))

            assert.equal(OwnereBalance.sub(OwnerBeforeBalance).add(gasFee).toString(), new BN('1950000000000000000').toString())
            assert.equal(serviceFeeRecipientBalance.sub(serviceFeeRecipientBeforeBalance).toString(), new BN('50000000000000000').toString())
        });
        it("result auction again", async () => {
            let thrownError;
            try {
                await auction_contract.endAuction(tokenId, accounts[1], {from: accounts[1]});
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'Auction.onlyCreatedAuction: Auction does not exist',
            )
        });
        it("cancel auction", async () => {
            await erc1155TokenContract.setApprovalForAll(
                auction_contract.address,
                true,
                { from: accounts[9] }
            );
            
            await auction_contract.createAuction(
                tokenId,
                startBidPrice,
                '0',
                '1916922014',
                { from: accounts[9] }
            );

            const bids = [
                {
                    from: accounts[5],
                    value: new BN('625000000000000000'),
                },
                {
                    from: accounts[6],
                    value: new BN('725000000000000000'),
                },
                {
                    from: accounts[7],
                    value: new BN('825000000000000000'),
                },
                {
                    from: accounts[8],
                    value: new BN('925000000000000000'),
                },
            ];

            const beforeBalances = [
                new BN(await web3.eth.getBalance(accounts[5])),
                new BN(await web3.eth.getBalance(accounts[6])),
                new BN(await web3.eth.getBalance(accounts[7])),
                new BN(await web3.eth.getBalance(accounts[8])),
            ]

            for(let i = 0; i < bids.length; i++) {
                const receipt = await auction_contract.placeBid(
                    tokenId,
                    accounts[9],
                    bids[i]
                );
                const tx = await web3.eth.getTransaction(receipt.tx);
                const gasFee = new BN(receipt.receipt.gasUsed).mul(new BN(tx.gasPrice));
                bids[i].gasFee = gasFee;
            }

            //Bidding works correctly
            let afterBalances = [
                new BN(await web3.eth.getBalance(accounts[5])),
                new BN(await web3.eth.getBalance(accounts[6])),
                new BN(await web3.eth.getBalance(accounts[7])),
                new BN(await web3.eth.getBalance(accounts[8])),
            ]

            for(let i = 0; i < 1; i++) {
                assert.equal(beforeBalances[i].sub(bids[i].gasFee).toString(), afterBalances[i].toString())
            }

            for(let i = 1; i < bids.length; i++) {
                assert.equal(beforeBalances[i].sub(bids[i].value).sub(bids[i].gasFee).toString(), afterBalances[i])
            }

            await auction_contract.cancelAuction(tokenId, accounts[9], {from: accounts[0]});

            afterBalances = [
                new BN(await web3.eth.getBalance(accounts[5])),
                new BN(await web3.eth.getBalance(accounts[6])),
                new BN(await web3.eth.getBalance(accounts[7])),
                new BN(await web3.eth.getBalance(accounts[8])),
            ]

            for(let i = 2; i < bids.length; i++) {
                assert.equal(beforeBalances[i].sub(afterBalances[i]).toString(), bids[i].gasFee.toString())
            }
        });
    });
});