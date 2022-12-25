import { assertIsDeliverTxSuccess, SigningStargateClient } from "@cosmjs/stargate";
import type { ChainInfo } from "@keplr-wallet/types";
import React, { useEffect, useState } from "react";
import osmo from "../config/osmosis";

function Keplr() {
	const [chain, setChain] = useState<ChainInfo>(osmo);
	const [selected, setSelected] = useState<string>("OSMO");
	const [client, setClient] = useState<any>();
	const [address, setAddress] = useState<any>();

	const [balance, setBalance] = useState<any>();
	const [recipent, setRecipent] = useState<any>(
		"osmo1r9ufesd4ja09g4rcxxetpx675eu09m45q05wv7"
	);
	const [tx, setTx] = useState<any>();
	const [sendHash, setSendHash] = useState<any>();
	const [txRes, setTxRes] = useState<any>();

	// 初始化 chain
	useEffect(() => {
		connectWallet();
	}, [chain]);

	// 查余额
	useEffect(() => {
		if (!address && !client) return;
		getBalances();
	}, [address, client, sendHash]);

	// 连接keplr钱包  Todo
	const connectWallet = async () => {
		const { keplr } = window
		if (!keplr) {
			alert("You need to install Keplr")
			return
		}

		await keplr.experimentalSuggestChain(chain);
		await keplr.enable(chain.chainId);

		// Create the signing client
		const offlineSigner = keplr.getOfflineSigner(chain.chainId);
		const client = await SigningStargateClient.connectWithSigner(
			chain.rpc,
			offlineSigner
		);
		setClient(client);

		const accounts = await offlineSigner.getAccounts();
		setAddress(accounts[0].address);
	};

	// 余额查询  Todo
	const getBalances = async () => {
		if (client) {
			const _balance = await client.getBalance(address, chain.stakeCurrency.coinMinimalDenom);
			setBalance(_balance);
		}
	};

	// txhash查询  Todo
	const getTx = async () => {
		if (tx) {
			setTxRes(await client.getTx(tx));
		}
	};

	// 转账 Todo
	const sendToken = async () => {
		if (!client || !address) {
			alert("Please connect Keplr wallet first");
			return;
		};
		if (!recipent) {
			alert("The receiver address cannot be empty");
			return;
		}

		const amount = 10 * 1e6;
		const res = await client.sendTokens(
			address,
			recipent,
			[{
				denom: chain.stakeCurrency.coinMinimalDenom,
				amount: amount.toString(),
			}],
			{
				amount: [{
					denom: chain.feeCurrencies[0].coinMinimalDenom,
					amount: 0.001,
				}],
				gas: "200000",
			},
			""
		);
		assertIsDeliverTxSuccess(res);
		if (res.code === 0) {
			alert(
				`Transfer to ${recipent} successfully.\n\n` +
				`Block Height: ${res.height}\n\n` +
				`Tx Hash: ${res.transactionHash}`
			);
			setTx(res.transactionHash);
		}
	};

	return (
		<div className="keplr">
			<h2>Keplr Wallet</h2>
			<label>
				<span>
					Chain: &nbsp;
					<select
						className="select"
						value={selected}
						onChange={(e) => setSelected(e.target.value)}
					>
						<option value="OSMO">OSMO</option>
						<option value="SPX">SPX</option>
					</select>
				</span>{" "}
				&nbsp;
				<button onClick={connectWallet}>
					{address ? "已连接" : "连接keplr"}
				</button>
			</label>
			<div className="weight">地址：{address}</div>
			<div className="weight">
				<span style={{ whiteSpace: "nowrap" }}>余额: &nbsp;</span>
				<div>
					{balance?.amount && (
						<>
							<span>
								{Number(balance?.amount) / Math.pow(10, chain?.stakeCurrency.coinDecimals)}
							</span>
							<span> {chain?.stakeCurrency.coinDenom}</span>
						</>
					)}
				</div>
			</div>
			<hr />
			<label>1、sendTokens() & broadcastTx</label>
			<div>
				<input
					type="text"
					value={recipent}
					placeholder="address"
					style={{ width: "350px" }}
					onChange={(e) => setRecipent(e.target.value)}
				/>
				&nbsp;
				<button onClick={sendToken}>
					发送 10 {chain?.stakeCurrency.coinDenom}
				</button>
			</div>
			<label>2、getTx()</label>
			<div>
				<input value={tx} readOnly style={{ width: "350px" }} />
				&nbsp;
				<button onClick={getTx}>查询</button>
			</div>
			<div className="tx">
				{txRes && (
					<>
						<div>height:{txRes?.height} </div>
						<div>gasUsed:{txRes?.gasUsed} </div>
						<div>gasWanted:{txRes?.gasWanted} </div>
						<br />
						<div>
							Click&nbsp;
							<a target="_blank" href={`https://testnet.mintscan.io/osmosis-testnet/txs/${tx}`}>here</a>
							&nbsp;to view more details
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export default Keplr;
