"use client";

import React, {useEffect, useState} from "react";
import {
    useAccount,
    useBalance,
    useConnect,
    useDisconnect,
    useReadContract,
    useWaitForTransactionReceipt,
    useWriteContract
} from "wagmi";
import {parseEther, formatEther} from 'viem';

import depositContractConfig from "../contracts/Deposit"

export default function Home() {
    const [depositAmount, setDepositAmount] = useState<string>("");
    const [withdrawAmount, setWithdrawAmount] = useState<string>("");
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [currentAction, setCurrentAction] = useState<'deposit' | 'withdraw' | 'ownerWithdraw' | null>(null);

    const {isConnected, address} = useAccount();
    const {connectors, connect} = useConnect();
    const {disconnect} = useDisconnect();

    const {
        data: txHash,
        error: writeError,
        isPending: isWriteLoading,
        writeContract
    } = useWriteContract()

    const connector = connectors[0];

    // balance in the contract
    const {data: contractBalance, refetch: refetchBalance} = useReadContract({
        ...depositContractConfig,
        functionName: "balanceOf",
        args: [address || '0x0000000000000000000000000000000000000000' as `0x${string}`],
        query: {
            enabled: !!address,
        }
    })

    // balance in the wallet
    const {data: walletBalance, refetch: refetchWalletBalance} = useBalance({
        address: address,
        query: {
            enabled: !!address,
        }
    });

    function handleDeposit() {
        if (!depositAmount) return;

        setCurrentAction('deposit');

        writeContract({
            ...depositContractConfig,
            functionName: "deposit",
            value: parseEther(depositAmount),
        })

        setStatusMessage('Processing deposit...')
    }

    function handleWithdraw() {
        if (!withdrawAmount) return;

        setCurrentAction('withdraw');

        writeContract({
            ...depositContractConfig,
            functionName: "withdraw",
            args: [parseEther(withdrawAmount)],
        })

        setStatusMessage('Processing withdrawal...')
    }

    function handleOwnerWithdraw() {
        setCurrentAction('ownerWithdraw');

        writeContract({
            ...depositContractConfig,
            functionName: "ownerWithdraw",
        })

        setStatusMessage('Processing owner withdrawal...')
    }

    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({
        hash: txHash,
        query: {
            enabled: !!txHash,
        }
    })

    useEffect(() => {
        if (writeError) {
            setStatusMessage(writeError.message)
        }
    }, [writeError])

    useEffect(() => {
        if (isConfirmed) {
            refetchBalance();
            refetchWalletBalance();

            if (statusMessage.includes("Processing deposit")) {
                setStatusMessage(`Successfully deposited ${depositAmount} ETH`);
                setDepositAmount("");
            } else if (statusMessage.includes("Processing withdrawal")) {
                setStatusMessage(`Successfully withdrew ${withdrawAmount} ETH`);
                setWithdrawAmount("");
            } else if (statusMessage.includes("Processing owner withdrawal")) {
                setStatusMessage("Successfully withdrew all funds");
            }
        }
    }, [isConfirmed, statusMessage, depositAmount, withdrawAmount, refetchBalance, refetchWalletBalance]);


    const isDepositLoading = currentAction === 'deposit' && (isWriteLoading || isConfirming);
    const isWithdrawLoading = currentAction === 'withdraw' && (isWriteLoading || isConfirming);
    const isOwnerWithdrawLoading = currentAction === 'ownerWithdraw' && (isWriteLoading || isConfirming);

    return (
        <>
            <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <h1 className="text-3xl font-bold text-center">ETH Deposit Contract</h1>
                </div>
            </div>

            <div className="p-6">
                {/* Connection Status */}
                <div className="mb-8 text-center">
                    {!isConnected ? (
                        <button
                            onClick={() => connect({connector})}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-150 ease-in-out shadow-lg"
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="bg-gray-700 rounded-lg px-4 py-2 mb-4 max-w-full overflow-hidden">
                                <p className="text-gray-400 text-sm mb-1">Connected Account:</p>
                                <p className="font-mono text-sm truncate">
                                    {address}
                                </p>
                            </div>
                            <button
                                onClick={() => disconnect()}
                                className="text-gray-400 hover:text-white text-sm underline"
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </div>

                {/* Balances Display */}
                {isConnected && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-700/50 rounded-lg p-4 text-center border border-gray-600">
                            <p className="text-gray-400 text-sm mb-1">Contract Balance:</p>
                            <p className="text-2xl font-bold">
                                {contractBalance ? formatEther(contractBalance) : "0.0"} <span
                                className="text-gray-400">ETH</span>
                            </p>
                        </div>

                        <div className="bg-gray-700/50 rounded-lg p-4 text-center border border-gray-600">
                            <p className="text-gray-400 text-sm mb-1">Wallet Balance:</p>
                            <p className="text-2xl font-bold">
                                {walletBalance?.value
                                    ? Number(formatEther(walletBalance.value)).toFixed(6)
                                    : "0.0"} <span className="text-gray-400">ETH</span>
                            </p>
                        </div>


                    </div>
                )}

                {/* Action Cards */}
                {isConnected && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Deposit Section */}
                        <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                            <h2 className="text-xl font-semibold mb-4 text-blue-400">Deposit ETH</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="depositAmount"
                                           className="block text-sm font-medium text-gray-300 mb-1">
                                        Amount (ETH)
                                    </label>
                                    <input
                                        id="depositAmount"
                                        type="number"
                                        placeholder="0.0"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        step="0.001"
                                        min="0"
                                    />
                                </div>
                                <button
                                    onClick={handleDeposit}
                                    disabled={isDepositLoading}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDepositLoading ? 'Processing...' : 'Deposit'}
                                </button>
                            </div>
                        </div>

                        {/* Withdraw form */}
                        <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                            <h2 className="text-xl font-semibold mb-4 text-red-400">Withdraw ETH</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="withdrawAmount"
                                           className="block text-sm font-medium text-gray-300 mb-1">
                                        Amount (ETH)
                                    </label>
                                    <input
                                        id="withdrawAmount"
                                        type="number"
                                        placeholder="0.0"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        disabled={isWithdrawLoading}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        step="0.001"
                                        min="0"
                                    />
                                </div>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={isWithdrawLoading || !withdrawAmount}
                                    className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isWithdrawLoading ? 'Processing...' : 'Withdraw'}
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {/* Owner Withdraw Button */}
                {isConnected && (
                    <div className="text-center mb-8">
                        <button
                            onClick={handleOwnerWithdraw}
                            disabled={isOwnerWithdrawLoading}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isOwnerWithdrawLoading ? 'Processing...' : 'Owner Withdraw'}
                        </button>
                    </div>
                )}

                {statusMessage && (
                    <div className="p-4 bg-gray-800 rounded-lg">
                        {statusMessage}
                    </div>
                )}

                {
                    isConnected && (
                        <button
                            onClick={() => disconnect()}
                            className="text-sm text-gray-400 underline mt-4"
                        >
                            Disconnect Wallet
                        </button>
                    )
                }
            </div>
        </>
    )
}
